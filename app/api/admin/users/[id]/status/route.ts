import { auth } from '@/auth';
import { ActivityLogger, getClientIP } from '@/lib/activity-logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
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

    const body = await req.json();
    const { status, suspensionDuration } = body;

    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
      return NextResponse.json(
        {
          error: 'Valid status is required (active, suspended, or banned)',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (status === 'suspended' && !suspensionDuration) {
      return NextResponse.json(
        {
          error: 'Suspension duration is required when suspending a user',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingUser = await db.users.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true, status: true }
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
          error: 'Cannot change status of admin users',
          success: false,
          data: null
        },
        { status: 403 }
      );
    }

    let suspendedUntil: Date | null = null;
    if (status === 'suspended' && suspensionDuration) {
      const now = new Date();
      const durationMap: { [key: string]: number } = {
        '24 hours': 24 * 60 * 60 * 1000,
        '48 hours': 48 * 60 * 60 * 1000,
        '72 hours': 72 * 60 * 60 * 1000,
        '7 days': 7 * 24 * 60 * 60 * 1000,
        '30 days': 30 * 24 * 60 * 60 * 1000,
        '3 months': 90 * 24 * 60 * 60 * 1000,
        '6 months': 180 * 24 * 60 * 60 * 1000,
        '1 year': 365 * 24 * 60 * 60 * 1000,
      };
      
      const durationMs = durationMap[suspensionDuration];
      if (durationMs) {
        suspendedUntil = new Date(now.getTime() + durationMs);
      }
    }

    const updatedUser = await db.$transaction(async (prisma) => {
      const user = await prisma.users.update({
        where: { id: userId },
        data: { 
          status,
          suspendedUntil: status === 'suspended' ? suspendedUntil : null
        },
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          suspendedUntil: true,
          updatedAt: true,
        }
      });

      if (status === 'suspended' || status === 'banned') {
        await prisma.sessions.deleteMany({
          where: { userId: userId }
        });
      }

      return user;
    });

    try {
      const adminUsername = session.user.username || session.user.email?.split('@')[0] || `admin${session.user.id}`;
      const targetUsername = existingUser.username || existingUser.email?.split('@')[0] || `user${existingUser.id}`;
      const clientIP = getClientIP(req);
      
      await ActivityLogger.userStatusChanged(
        session.user.id,
        adminUsername,
        existingUser.id,
        targetUsername,
        existingUser.status,
        status,
        clientIP
      );
    } catch (logError) {
      console.error('Failed to log status change activity:', logError);
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User status updated to ${status} successfully${status === 'suspended' || status === 'banned' ? ' and user sessions invalidated' : ''}`,
      error: null
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string   }> }
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

    const { id  } = await params;
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

    const user = await db.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        suspendedUntil: true,
        role: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      error: null
    });

  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch status: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
