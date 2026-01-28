/**
 * View Snippet API Endpoint
 * GET /api/snippets/[id]
 * Returns snippet content with expiration checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch snippet from database
    const snippet = await prisma.snippet.findUnique({
      where: { id },
    });

    // 1. Check if snippet exists
    if (!snippet) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      );
    }

    // 2. Check time-based expiration (if set)
    if (snippet.expiresAt) {
      const now = new Date();
      if (now > snippet.expiresAt) {
        return NextResponse.json(
          { error: 'Snippet has expired' },
          { status: 410 }
        );
      }
    }

    // 3. Check view-based expiration (if set)
    if (snippet.maxViews !== null && snippet.viewCount >= snippet.maxViews) {
      return NextResponse.json(
        { error: 'Snippet has expired' },
        { status: 410 }
      );
    }

    // 4. Atomically increment view count and return snippet
    const updatedSnippet = await prisma.snippet.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Return snippet content
    return NextResponse.json(
      {
        content: updatedSnippet.content,
        viewCount: updatedSnippet.viewCount,
        createdAt: updatedSnippet.createdAt.toISOString(),
        expiresAt: updatedSnippet.expiresAt?.toISOString() || null,
        maxViews: updatedSnippet.maxViews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching snippet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snippet' },
      { status: 500 }
    );
  }
}
