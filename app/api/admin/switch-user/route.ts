import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const adminUser = await prisma.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true }
    });

    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'moderator')) {
      return NextResponse.json(
        { success: false, error: 'Admin or Moderator access required' },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, username: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.role === 'admin' || targetUser.role === 'moderator') {
      return NextResponse.json(
        { success: false, error: 'Cannot switch to another admin or moderator account' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: `Switched to user: ${targetUser.username}`,
      user: targetUser
    });

    response.cookies.set('impersonated-user-id', userId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    });

    response.cookies.set('original-admin-id', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    });

    response.cookies.set('original-admin-role', adminUser.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    });

    return response;
  } catch (error) {
    console.error('Switch user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
