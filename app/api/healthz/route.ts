/**
 * Health Check Endpoint
 * GET /api/healthz
 * Must return HTTP 200, JSON, and reflect database connectivity
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      { ok: true },
      { status: 200 }
    );
  } catch (error) {
    // Database connection failed
    return NextResponse.json(
      { ok: false, error: 'Database connection failed' },
      { status: 200 } // Still return 200 as per spec, but indicate failure in body
    );
  }
}
