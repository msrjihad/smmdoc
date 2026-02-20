import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { announcementId } = body;

    if (!announcementId) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id as number;

    const announcement = await db.announcements.findUnique({
      where: { id: parseInt(announcementId) },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    if (announcement.isSticky) {
      return NextResponse.json(
        { error: 'Cannot dismiss pinned announcements' },
        { status: 400 }
      );
    }

    await db.dismissedAnnouncements.upsert({
      where: {
        announcementId_userId: {
          announcementId: parseInt(announcementId),
          userId,
        },
      },
      create: {
        announcementId: parseInt(announcementId),
        userId,
      },
      update: {},
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement dismissed',
    });
  } catch (error) {
    console.error('Error dismissing announcement:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss announcement' },
      { status: 500 }
    );
  }
}

