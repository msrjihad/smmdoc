import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    await db.announcements.updateMany({
      where: {
        status: { in: ['active', 'scheduled'] },
        endDate: { not: null, lte: now },
      },
      data: {
        status: 'expired',
      },
    });

    const announcements = await db.announcements.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      type,
      targetedAudience,
      startDate,
      endDate,
      isSticky,
      buttonEnabled,
      buttonText,
      buttonLink,
      visibility,
    } = body;

    if (!title || !type || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = endDate && endDate.trim() ? new Date(endDate) : null;
    const now = new Date();
    
    let status: string;
    if (end && end < now) {
      status = 'expired';
    } else {
      status = start <= now ? 'active' : 'scheduled';
    }

    const minOrderAnnouncement = await db.announcements.findFirst({
      orderBy: { order: 'asc' },
      select: { order: true },
    });
    const newOrder = minOrderAnnouncement ? minOrderAnnouncement.order - 1 : 0;

    const announcement = await db.announcements.create({
      data: {
        title,
        content,
        type,
        status,
        targetedAudience: targetedAudience || 'users',
        startDate: new Date(startDate),
        endDate: end,
        isSticky: isSticky || false,
        buttonEnabled: buttonEnabled || false,
        buttonText: buttonText && buttonText.trim() ? buttonText.trim() : null,
        buttonLink: buttonLink && buttonLink.trim() ? buttonLink.trim() : null,
        visibility: visibility || 'dashboard',
        createdBy: session.user.id as number,
        order: newOrder,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create announcement';
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

