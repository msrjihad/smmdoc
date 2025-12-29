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
    const { role, permissions } = body;

    if (!role || !['user', 'admin', 'moderator'].includes(role)) {
      return NextResponse.json(
        {
          error: 'Valid role is required (user, admin, or moderator)',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (role === 'moderator' && permissions) {
      if (!Array.isArray(permissions)) {
        return NextResponse.json(
          {
            error: 'Permissions must be an array',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }

    const existingUser = await db.users.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, email: true }
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

    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        {
          error: 'Cannot change your own role',
          success: false,
          data: null
        },
        { status: 403 }
      );
    }

    const updateData: any = { role };
    
    if (role === 'moderator' && permissions) {
      updateData.permissions = permissions;
    } else if (role !== 'moderator') {
      updateData.permissions = null;
    }

    const updatedUser = await db.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        updatedAt: true,
      }
    });

    try {
      const adminUsername = session.user.username || session.user.email?.split('@')[0] || `admin${session.user.id}`;
      const targetUsername = existingUser.username || existingUser.email?.split('@')[0] || `user${existingUser.id}`;
      const clientIP = getClientIP(req);
      
      await ActivityLogger.userRoleChanged(
        session.user.id,
        adminUsername,
        existingUser.id,
        targetUsername,
        existingUser.role,
        role,
        clientIP
      );
    } catch (logError) {
      console.error('Failed to log role change activity:', logError);
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User role updated to ${role} successfully`,
      error: null
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      {
        error: 'Failed to update role: ' + (error instanceof Error ? error.message : 'Unknown error'),
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

    const { id  } = await params;

    const user = await db.users.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        email: true,
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
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch role: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
