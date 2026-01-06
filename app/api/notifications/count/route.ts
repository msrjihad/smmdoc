import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const unreadCount = await db.notifications.count({
      where: {
        userId: userId,
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      unreadCount: unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      { success: false, unreadCount: 0 },
      { status: 500 }
    );
  }
}

