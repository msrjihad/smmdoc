import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        {
          error: 'Invalid user ID format',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingUser = await db.users.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    if (existingUser.role === 'admin') {
      return NextResponse.json(
        {
          error: 'Cannot invalidate admin user sessions',
          success: false,
          data: null
        },
        { status: 403 }
      );
    }

    await db.sessions.deleteMany({
      where: { userId: userId }
    });

    return NextResponse.json({
      success: true,
      data: null,
      message: 'User sessions invalidated successfully',
      error: null
    });

  } catch (error) {
    console.error('Error invalidating user sessions:', error);
    return NextResponse.json(
      {
        error: 'Failed to invalidate sessions: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
