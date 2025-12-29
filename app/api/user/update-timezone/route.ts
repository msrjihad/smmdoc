import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogger } from '@/lib/activity-logger';

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
    const { timezone } = body;

    if (!timezone) {
      return NextResponse.json(
        {
          error: 'Timezone is required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingUser = await db.users.findUnique({
      where: { id: session.user.id }
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
        timezone: timezone,
        updatedAt: new Date()
      },
      select: {
        id: true,
        timezone: true,
        updatedAt: true,
      }
    });

    try {
      const username = session.user.username || session.user.email?.split('@')[0] || `user${session.user.id}`;
      await ActivityLogger.profileUpdated(
        session.user.id,
        username,
        'timezone'
      );
    } catch (error) {
      console.error('Failed to log timezone update activity:', error);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          timezone: updatedUser.timezone,
          updatedAt: updatedUser.updatedAt
        },
        error: null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Timezone update error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update timezone',
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
