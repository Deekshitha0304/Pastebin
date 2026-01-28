/**
 * Fetch Paste API Endpoint
 * GET /api/pastes/:id
 * Returns paste content with expiration checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper to get current time (supports TEST_MODE)
function getCurrentTime(request: NextRequest): Date {
  // Check if TEST_MODE is enabled
  if (process.env.TEST_MODE === '1') {
    const testNowMs = request.headers.get('x-test-now-ms');
    if (testNowMs) {
      const testTime = parseInt(testNowMs, 10);
      if (!isNaN(testTime)) {
        return new Date(testTime);
      }
    }
  }
  // Use real system time
  return new Date();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const now = getCurrentTime(request);

    // Fetch paste from database
    const paste = await prisma.snippet.findUnique({
      where: { id },
    });

    // 1. Check if paste exists
    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      );
    }

    // 2. Check time-based expiration (if set)
    if (paste.expiresAt) {
      if (now > paste.expiresAt) {
        return NextResponse.json(
          { error: 'Paste not found' },
          { status: 404 }
        );
      }
    }

    // 3. Check view-based expiration (if set)
    if (paste.maxViews !== null && paste.viewCount >= paste.maxViews) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      );
    }

    // 4. Atomically increment view count and return paste
    const updatedPaste = await prisma.snippet.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Calculate remaining_views
    const remaining_views = updatedPaste.maxViews !== null
      ? Math.max(0, updatedPaste.maxViews - updatedPaste.viewCount)
      : null;

    // Return paste content (per spec format)
    return NextResponse.json(
      {
        content: updatedPaste.content,
        remaining_views,
        expires_at: updatedPaste.expiresAt?.toISOString() || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching paste:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paste' },
      { status: 500 }
    );
  }
}
