import { auth } from '@/auth';
import { ActivityLogger, getClientIP } from '@/lib/activity-logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
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
      where: { id: userId }
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

    if (!['admin', 'moderator'].includes(existingUser.role)) {
      return NextResponse.json(
        {
          error: 'This endpoint is only for deleting admin/moderator users',
          success: false,
          data: null
        },
        { status: 403 }
      );
    }

    if (existingUser.id === parseInt(session.user.id)) {
      return NextResponse.json(
        {
          error: 'Cannot delete your own admin account',
          success: false,
          data: null
        },
        { status: 403 }
      );
    }

    try {
      const adminUsername = session.user.username || session.user.email?.split('@')[0] || `admin${session.user.id}`;
      const targetUsername = existingUser.username || existingUser.email?.split('@')[0] || `user${existingUser.id}`;
      const clientIP = getClientIP(req);
      
      await ActivityLogger.userDeleted(
        session.user.id,
        adminUsername,
        existingUser.id,
        targetUsername,
        clientIP
      );
    } catch (logError) {
      console.error('Failed to log admin deletion activity:', logError);
    }

    try {
      await db.users.update({
        where: { id: userId },
        data: {
          status: 'deleted',
          email: `deleted_${userId}_${Date.now()}@deleted.com`,
          name: `Deleted Admin ${userId}`,
          username: `deleted_${userId}`,
          password: null,
          emailVerified: null,
          image: null,
          balance: 0
        }
      });

      await db.sessions.deleteMany({
        where: { userId: userId }
      });

      try {
        await db.accounts.deleteMany({
          where: { userId: userId }
        });
      } catch (error) {
        console.warn('Could not delete OAuth accounts:', error);
      }
    } catch (error) {
      console.error('Error during admin deletion process:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Admin user deleted successfully and sessions invalidated',
      error: null
    });

  } catch (error) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete admin user: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
