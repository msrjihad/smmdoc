import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, announcementIds } = body;

    const idArray = ids || announcementIds;

    if (!Array.isArray(idArray)) {
      return NextResponse.json(
        { error: 'ids must be an array' },
        { status: 400 }
      );
    }

    const updatePromises = idArray.map((id: number, index: number) =>
      db.announcements.update({
        where: { id },
        data: { order: index },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Announcements reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering announcements:', error);
    return NextResponse.json(
      { error: 'Failed to reorder announcements' },
      { status: 500 }
    );
  }
}

