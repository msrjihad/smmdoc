import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access. Please login.', success: false, data: null },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { image } = body;

    if (typeof image !== 'string' || !image.trim()) {
      return NextResponse.json(
        { error: 'Image URL is required.', success: false, data: null },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user session', success: false, data: null },
        { status: 401 }
      );
    }

    const updatedUser = await db.users.update({
      where: { id: userId },
      data: { image: image.trim(), updatedAt: new Date() },
      select: { id: true, image: true, updatedAt: true },
    });

    try {
      const username = session.user.username || session.user.email?.split('@')[0] || `user${userId}`;
      await ActivityLogger.profileUpdated(userId, username, 'profile picture');
    } catch (error) {
      console.error('Failed to log profile picture update activity:', error);
    }

    return NextResponse.json({
      success: true,
      data: { image: updatedUser.image, updatedAt: updatedUser.updatedAt },
      error: null,
    });
  } catch (error) {
    console.error('Set profile image error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile picture', success: false, data: null },
      { status: 500 }
    );
  }
}
