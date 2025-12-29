import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid announcement ID' }, { status: 400 });
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
      status,
      visibility,
    } = body;

    const existing = await db.announcements.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const now = new Date();
    let finalStatus = status;
    
    if (!finalStatus && startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;
      
      if (end && end < now) {
        finalStatus = 'expired';
      } else {
        finalStatus = start <= now ? 'active' : 'scheduled';
      }
    } else if (finalStatus && endDate) {
      const end = new Date(endDate);
      if (end < now && finalStatus !== 'expired') {
        finalStatus = 'expired';
      }
    } else if (!finalStatus && endDate) {
      const end = new Date(endDate);
      if (end < now) {
        finalStatus = 'expired';
      }
    }

    let updatedStartDate = startDate ? new Date(startDate) : undefined;
    let updatedEndDate = endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined;
    
    if (status === 'active') {
      if (existing.status === 'scheduled') {
        updatedStartDate = new Date();
      } else if (existing.status === 'expired') {
        updatedStartDate = new Date();
        updatedEndDate = null;
      }
    }

    const announcement = await db.announcements.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content: content && content.trim() ? content.trim() : null }),
        ...(type && { type }),
        ...(targetedAudience && { targetedAudience }),
        ...(updatedStartDate !== undefined && { startDate: updatedStartDate }),
        ...(updatedEndDate !== undefined ? { endDate: updatedEndDate } : (endDate !== undefined && { endDate: endDate ? new Date(endDate) : null })),
        ...(isSticky !== undefined && { isSticky }),
        ...(buttonEnabled !== undefined && { buttonEnabled }),
        ...(buttonText !== undefined && { buttonText: buttonText && buttonText.trim() ? buttonText.trim() : null }),
        ...(buttonLink !== undefined && { buttonLink: buttonLink && buttonLink.trim() ? buttonLink.trim() : null }),
        ...(visibility !== undefined && { visibility }),
        ...(finalStatus && { status: finalStatus }),
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
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid announcement ID' }, { status: 400 });
    }

    await db.announcements.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}

