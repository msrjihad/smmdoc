import { NextResponse } from 'next/server';

/**
 * Simple health check endpoint that doesn't require database access.
 * Used by OfflineDetector to check internet connectivity only.
 */
export async function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}

