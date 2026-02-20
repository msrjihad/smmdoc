import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Please login.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        {
          error: 'Enabled status must be a boolean value',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingUser = await db.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isTwoFactorEnabled: true,
        username: true,
        email: true
      }
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

    const updatedUser = await db.users.update({
      where: { id: session.user.id },
      data: { 
        isTwoFactorEnabled: enabled,
        updatedAt: new Date()
      },
      select: {
        id: true,
        isTwoFactorEnabled: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          isTwoFactorEnabled: updatedUser.isTwoFactorEnabled,
          updatedAt: updatedUser.updatedAt
        },
        error: null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('2FA toggle error:', error);
    return NextResponse.json(
      {
        error: 'Failed to toggle 2FA',
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
