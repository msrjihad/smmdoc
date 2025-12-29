import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const visibility = searchParams.get('visibility');

    const userId = session.user.id as number;
    const userRole = session.user.role?.toLowerCase() || 'user';

    const now = new Date();

    const dismissed = await db.dismissedAnnouncements.findMany({
      where: { userId },
      select: { announcementId: true },
    });
    const dismissedIds = dismissed.map(d => d.announcementId);

    let audienceFilter: string[];
    if (userRole === 'admin') {
      audienceFilter = ['admins', 'moderators'];
    } else if (userRole === 'moderator') {
      audienceFilter = ['moderators'];
    } else {
      audienceFilter = ['users', 'all'];
    }

    const visibilityFilter = visibility === 'dashboard' 
      ? { visibility: 'dashboard' }
      : visibility === 'all_pages'
      ? { visibility: 'all_pages' }
      : { OR: [{ visibility: 'dashboard' }, { visibility: 'all_pages' }] };

    const announcements = await db.announcements.findMany({
      where: {
        status: 'active',
        targetedAudience: { in: audienceFilter },
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
        NOT: {
          id: { in: dismissedIds },
        },
        ...visibilityFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    await Promise.all(
      announcements.map(async (ann) => {
        const existingView = await db.viewedAnnouncements.findUnique({
          where: {
            announcementId_userId: {
              announcementId: ann.id,
              userId: userId,
            },
          },
        });

        if (!existingView) {
          await db.$transaction([
            db.viewedAnnouncements.create({
              data: {
                announcementId: ann.id,
                userId: userId,
              },
            }),
            db.announcements.update({
              where: { id: ann.id },
              data: { views: { increment: 1 } },
            }),
          ]);
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error('Error fetching user announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

