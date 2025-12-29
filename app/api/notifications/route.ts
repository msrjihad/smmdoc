import { requireAuth } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await requireAuth();

    return NextResponse.json({
      success: true,
      notifications: []
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications', notifications: [] },
      { status: 500 }
    );
  }
}

