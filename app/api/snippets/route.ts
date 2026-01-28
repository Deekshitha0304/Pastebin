/**
 * Create Snippet API Endpoint
 * POST /api/snippets
 * Creates a new snippet with expiration rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSnippetId, validateSnippetInput } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { content, expiresAt, maxViews } = body;

    // Validate input
    const validation = validateSnippetInput(content, expiresAt, maxViews);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = generateSnippetId();

    // Save snippet to database
    const snippet = await prisma.snippet.create({
      data: {
        id,
        content,
        expiresAt: new Date(expiresAt),
        maxViews,
        viewCount: 0,
      },
    });

    // Get the host from request headers for the URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const url = `${protocol}://${host}/s/${snippet.id}`;

    // Return success response
    return NextResponse.json(
      { id: snippet.id, url },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating snippet:', error);
    return NextResponse.json(
      { error: 'Failed to create snippet' },
      { status: 500 }
    );
  }
}
