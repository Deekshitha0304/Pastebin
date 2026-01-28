/**
 * Create Paste API Endpoint
 * POST /api/pastes
 * Creates a new paste with expiration rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSnippetId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { content, ttl_seconds, max_views } = body;

    // Validate content is required and non-empty
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'content is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate ttl_seconds if provided
    if (ttl_seconds !== undefined && ttl_seconds !== null) {
      if (!Number.isInteger(ttl_seconds) || ttl_seconds < 1) {
        return NextResponse.json(
          { error: 'ttl_seconds must be an integer ≥ 1' },
          { status: 400 }
        );
      }
    }

    // Validate max_views if provided
    if (max_views !== undefined && max_views !== null) {
      if (!Number.isInteger(max_views) || max_views < 1) {
        return NextResponse.json(
          { error: 'max_views must be an integer ≥ 1' },
          { status: 400 }
        );
      }
    }

    // Generate unique ID
    const id = generateSnippetId();

    // Calculate expiresAt from ttl_seconds
    let expiresAt: Date | null = null;
    if (ttl_seconds) {
      expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + ttl_seconds);
    }

    // Save paste to database
    const paste = await prisma.snippet.create({
      data: {
        id,
        content: content.trim(),
        expiresAt,
        maxViews: max_views || null,
        viewCount: 0,
      },
    });

    // Get the host from request headers for the URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const url = `${protocol}://${host}/p/${paste.id}`;

    // Return success response
    return NextResponse.json(
      { id: paste.id, url },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json(
      { error: 'Failed to create paste' },
      { status: 500 }
    );
  }
}
