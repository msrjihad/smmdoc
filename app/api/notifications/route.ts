import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [notifications, totalCount, unreadCount] = await Promise.all([
      db.notifications.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          link: true,
          read: true,
          createdAt: true,
        },
      }),
      db.notifications.count({
        where: {
          userId: userId,
        },
      }),
      db.notifications.count({
        where: {
          userId: userId,
          read: false,
        },
      }),
    ]);

    const formattedNotifications = notifications.map(notif => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      link: notif.link,
      read: notif.read,
      createdAt: notif.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      totalCount: totalCount,
      unreadCount: unreadCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications', notifications: [] },
      { status: 500 }
    );
  }
}

