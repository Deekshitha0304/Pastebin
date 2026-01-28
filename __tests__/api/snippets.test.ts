/**
 * API Integration Tests for Pastebin
 * Tests all core functionality as per task requirements
 */

import { prisma } from '@/lib/db';
import { POST } from '@/app/api/snippets/route';
import { GET } from '@/app/api/snippets/[id]/route';
import { NextRequest } from 'next/server';

// Helper to create a mock NextRequest
function createMockRequest(method: string, body?: any): NextRequest {
  const url = 'http://localhost:3000/api/snippets';
  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'host': 'localhost:3000',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/snippets - Create Snippet', () => {
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

  test('should create snippet with both expiry methods', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const request = createMockRequest('POST', {
      content: 'TEST_both_expiry_methods',
      expiresAt: futureDate.toISOString(),
      maxViews: 10,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('url');
    expect(data.url).toContain(data.id);
  });

  test('should create snippet with only expiresAt', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const request = createMockRequest('POST', {
      content: 'TEST_only_expiry_time',
      expiresAt: futureDate.toISOString(),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
  });

  test('should create snippet with only maxViews', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_only_max_views',
      maxViews: 5,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
  });

  test('should reject empty content', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const request = createMockRequest('POST', {
      content: '',
      expiresAt: futureDate.toISOString(),
      maxViews: 10,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Content cannot be empty');
  });

  test('should reject past expiry date', async () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);

    const request = createMockRequest('POST', {
      content: 'TEST_past_date',
      expiresAt: pastDate.toISOString(),
      maxViews: 10,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('future');
  });

  test('should reject invalid maxViews', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const request = createMockRequest('POST', {
      content: 'TEST_invalid_views',
      expiresAt: futureDate.toISOString(),
      maxViews: 0,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('positive integer');
  });

  test('should reject when no expiry method provided', async () => {
    const request = createMockRequest('POST', {
      content: 'TEST_no_expiry',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('At least one expiry method');
  });
});

describe('GET /api/snippets/[id] - View Snippet', () => {
  let testSnippetId: string;

  beforeEach(async () => {
    // Create a test snippet
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const snippet = await prisma.snippet.create({
      data: {
        id: 'TEST_' + Math.random().toString(36).substring(7),
        content: 'Test content for viewing',
        expiresAt: futureDate,
        maxViews: 3,
        viewCount: 0,
      },
    });
    testSnippetId = snippet.id;
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

  test('should return snippet and increment view count', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/snippets/' + testSnippetId),
      { params: { id: testSnippetId } }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('viewCount');
    expect(data).toHaveProperty('expiresAt');
    expect(data).toHaveProperty('maxViews');
    expect(data).toHaveProperty('createdAt');
    expect(data.viewCount).toBe(1);
  });

  test('should return 404 for non-existent snippet', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/snippets/nonexistent'),
      { params: { id: 'nonexistent' } }
    );

    expect(response.status).toBe(404);
  });

  test('should return 410 when maxViews exceeded', async () => {
    // View the snippet 3 times (maxViews = 3)
    await GET(
      new NextRequest('http://localhost:3000/api/snippets/' + testSnippetId),
      { params: { id: testSnippetId } }
    );
    await GET(
      new NextRequest('http://localhost:3000/api/snippets/' + testSnippetId),
      { params: { id: testSnippetId } }
    );
    await GET(
      new NextRequest('http://localhost:3000/api/snippets/' + testSnippetId),
      { params: { id: testSnippetId } }
    );

    // 4th view should return 410
    const response = await GET(
      new NextRequest('http://localhost:3000/api/snippets/' + testSnippetId),
      { params: { id: testSnippetId } }
    );

    expect(response.status).toBe(410);
  });

  test('should return 410 when time expired', async () => {
    // Create an expired snippet
    const pastDate = new Date();
    pastDate.setSeconds(pastDate.getSeconds() - 1);

    const expiredSnippet = await prisma.snippet.create({
      data: {
        id: 'TEST_expired_' + Math.random().toString(36).substring(7),
        content: 'Expired content',
        expiresAt: pastDate,
        maxViews: 10,
        viewCount: 0,
      },
    });

    const response = await GET(
      new NextRequest('http://localhost:3000/api/snippets/' + expiredSnippet.id),
      { params: { id: expiredSnippet.id } }
    );

    expect(response.status).toBe(410);

    // Cleanup
    await prisma.snippet.delete({ where: { id: expiredSnippet.id } });
  });

  test('should atomically increment view count', async () => {
    // View twice
    await GET(
      new NextRequest('http://localhost:3000/api/snippets/' + testSnippetId),
      { params: { id: testSnippetId } }
    );
    const response = await GET(
      new NextRequest('http://localhost:3000/api/snippets/' + testSnippetId),
      { params: { id: testSnippetId } }
    );
    const data = await response.json();

    expect(data.viewCount).toBe(2);
  });
});

describe('Expiry Logic Order', () => {
  test('should check existence before expiry', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/snippets/nonexistent123'),
      { params: { id: 'nonexistent123' } }
    );

    // Should be 404 (not found) not 410 (expired)
    expect(response.status).toBe(404);
  });
});

describe('ID Generation', () => {
  test('should generate unique IDs', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const request1 = createMockRequest('POST', {
      content: 'TEST_unique_1',
      expiresAt: futureDate.toISOString(),
      maxViews: 10,
    });

    const request2 = createMockRequest('POST', {
      content: 'TEST_unique_2',
      expiresAt: futureDate.toISOString(),
      maxViews: 10,
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
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const request = createMockRequest('POST', {
      content: 'TEST_url_safe',
      expiresAt: futureDate.toISOString(),
      maxViews: 10,
    });

    const response = await POST(request);
    const data = await response.json();

    // URL-safe characters: alphanumeric, -, _
    expect(data.id).toMatch(/^[a-zA-Z0-9_-]+$/);

    // Cleanup
    await prisma.snippet.delete({ where: { id: data.id } });
  });
});
