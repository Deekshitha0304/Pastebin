/**
 * API Integration Tests for Pastebin-Lite
 * Tests all core functionality as per PDF specification
 */

import { prisma } from '@/lib/db';
import { POST } from '@/app/api/pastes/route';
import { GET } from '@/app/api/pastes/[id]/route';
import { NextRequest } from 'next/server';

// Helper to create a mock NextRequest
function createMockRequest(method: string, body?: any, headers?: Record<string, string>): NextRequest {
  const url = 'http://localhost:3000/api/pastes';
  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    'host': 'localhost:3000',
    ...headers,
  });
  return new NextRequest(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/pastes - Create Paste', () => {
  afterEach(async () => {
    // Clean up test data
    await prisma.snippet.deleteMany({
      where: {
        content: {
          contains: 'TEST_',
        },
      },
    });
  });

  test('should create paste with both ttl_seconds and max_views', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_both_constraints',
      ttl_seconds: 3600,
      max_views: 10,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('url');
    expect(data.url).toContain('/p/');
    expect(data.url).toContain(data.id);
  });

  test('should create paste with only ttl_seconds', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_only_ttl',
      ttl_seconds: 1800,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.url).toContain('/p/');
  });

  test('should create paste with only max_views', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_only_max_views',
      max_views: 5,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
  });

  test('should create paste with no constraints (both optional)', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_no_constraints',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
  });

  test('should reject empty content', async () => {
    const request = createMockRequest('POST', {
      content: '',
      ttl_seconds: 3600,
      max_views: 10,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('content is required');
  });

  test('should reject invalid ttl_seconds (< 1)', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_invalid_ttl',
      ttl_seconds: 0,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('ttl_seconds');
  });

  test('should reject invalid max_views (< 1)', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_invalid_views',
      max_views: 0,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('max_views');
  });

  test('should reject non-integer ttl_seconds', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_non_integer_ttl',
      ttl_seconds: 60.5,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });
});

describe('GET /api/pastes/:id - Fetch Paste', () => {
  let testPasteId: string;

  beforeEach(async () => {
    // Create a test paste
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const paste = await prisma.snippet.create({
      data: {
        id: 'TEST_' + Math.random().toString(36).substring(7),
        content: 'Test paste content',
        expiresAt: futureDate,
        maxViews: 3,
        viewCount: 0,
      },
    });
    testPasteId = paste.id;
  });

  afterEach(async () => {
    // Clean up
    await prisma.snippet.deleteMany({
      where: {
        id: {
          startsWith: 'TEST_',
        },
      },
    });
  });

  test('should return paste and increment view count', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + testPasteId),
      { params: { id: testPasteId } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('remaining_views');
    expect(data).toHaveProperty('expires_at');
    expect(data.remaining_views).toBe(2); // 3 - 1 = 2
  });

  test('should return 404 for non-existent paste', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/pastes/nonexistent'),
      { params: { id: 'nonexistent' } }
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  test('should return 404 when max_views exceeded', async () => {
    // View the paste 3 times (maxViews = 3)
    await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + testPasteId),
      { params: { id: testPasteId } }
    );
    await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + testPasteId),
      { params: { id: testPasteId } }
    );
    await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + testPasteId),
      { params: { id: testPasteId } }
    );

    // 4th view should return 404
    const response = await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + testPasteId),
      { params: { id: testPasteId } }
    );

    expect(response.status).toBe(404);
  });

  test('should return 404 when time expired (TEST_MODE)', async () => {
    // Create an expired paste
    const pastDate = new Date();
    pastDate.setSeconds(pastDate.getSeconds() - 1);

    const expiredPaste = await prisma.snippet.create({
      data: {
        id: 'TEST_expired_' + Math.random().toString(36).substring(7),
        content: 'Expired paste',
        expiresAt: pastDate,
        maxViews: 10,
        viewCount: 0,
      },
    });

    // Set TEST_MODE and use x-test-now-ms header
    process.env.TEST_MODE = '1';
    const testTime = pastDate.getTime() + 2000; // 2 seconds after expiry

    const response = await GET(
      createMockRequest('GET', undefined, {
        'x-test-now-ms': testTime.toString(),
      }),
      { params: { id: expiredPaste.id } }
    );

    expect(response.status).toBe(404);

    // Cleanup
    await prisma.snippet.delete({ where: { id: expiredPaste.id } });
    delete process.env.TEST_MODE;
  });

  test('should return null for remaining_views when unlimited', async () => {
    // Create paste with only ttl_seconds (no max_views)
    const paste = await prisma.snippet.create({
      data: {
        id: 'TEST_unlimited_' + Math.random().toString(36).substring(7),
        content: 'Unlimited views',
        expiresAt: new Date(Date.now() + 3600000),
        maxViews: null,
        viewCount: 0,
      },
    });

    const response = await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + paste.id),
      { params: { id: paste.id } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.remaining_views).toBeNull();

    // Cleanup
    await prisma.snippet.delete({ where: { id: paste.id } });
  });

  test('should return null for expires_at when no TTL', async () => {
    // Create paste with only max_views (no ttl_seconds)
    const paste = await prisma.snippet.create({
      data: {
        id: 'TEST_no_ttl_' + Math.random().toString(36).substring(7),
        content: 'No TTL',
        expiresAt: null,
        maxViews: 5,
        viewCount: 0,
      },
    });

    const response = await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + paste.id),
      { params: { id: paste.id } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.expires_at).toBeNull();

    // Cleanup
    await prisma.snippet.delete({ where: { id: paste.id } });
  });

  test('should atomically increment view count', async () => {
    // View twice
    await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + testPasteId),
      { params: { id: testPasteId } }
    );
    const response = await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + testPasteId),
      { params: { id: testPasteId } }
    );
    const data = await response.json();

    expect(data.remaining_views).toBe(1); // 3 - 2 = 1
  });
});

describe('GET /api/healthz - Health Check', () => {
  test('should return 200 with ok: true', async () => {
    const { GET } = await import('@/app/api/healthz/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('ok');
    expect(typeof data.ok).toBe('boolean');
  });
});

describe('Combined Constraints', () => {
  test('paste becomes unavailable when first constraint triggers', async () => {
    // Create paste with both constraints
    const paste = await prisma.snippet.create({
      data: {
        id: 'TEST_combined_' + Math.random().toString(36).substring(7),
        content: 'Combined constraints',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        maxViews: 1, // Only 1 view
        viewCount: 0,
      },
    });

    // First view should work
    const response1 = await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + paste.id),
      { params: { id: paste.id } }
    );
    expect(response1.status).toBe(200);

    // Second view should return 404 (max_views reached first)
    const response2 = await GET(
      new NextRequest('http://localhost:3000/api/pastes/' + paste.id),
      { params: { id: paste.id } }
    );
    expect(response2.status).toBe(404);

    // Cleanup
    await prisma.snippet.delete({ where: { id: paste.id } });
  });
});

describe('ID Generation', () => {
  test('should generate unique IDs', async () => {
    const request1 = createMockRequest('POST', {
      content: 'TEST_unique_1',
      max_views: 10,
    });

    const request2 = createMockRequest('POST', {
      content: 'TEST_unique_2',
      max_views: 10,
    });

    const response1 = await POST(request1);
    const response2 = await POST(request2);

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(data1.id).not.toBe(data2.id);

    // Cleanup
    await prisma.snippet.deleteMany({
      where: {
        id: {
          in: [data1.id, data2.id],
        },
      },
    });
  });

  test('IDs should be URL-safe', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_url_safe',
      max_views: 10,
    });

    const response = await POST(request);
    const data = await response.json();

    // URL-safe characters: alphanumeric, -, _
    expect(data.id).toMatch(/^[a-zA-Z0-9_-]+$/);

    // Cleanup
    await prisma.snippet.delete({ where: { id: data.id } });
  });
});
