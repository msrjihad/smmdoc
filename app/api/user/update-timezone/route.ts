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
    const { timezone, timeFormat } = body;

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

    if (timeFormat && timeFormat !== '12' && timeFormat !== '24') {
      return NextResponse.json(
        {
          error: 'Time format must be either "12" or "24"',
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

    const updateData: any = {
      timezone: timezone,
      updatedAt: new Date()
    };

    updateData.timeFormat = timeFormat || '24';

    console.log('Updating user with data:', {
      userId: session.user.id,
      timezone: updateData.timezone,
      timeFormat: updateData.timeFormat
    });

    try {
      const updatedUser = await db.users.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          timezone: true,
          timeFormat: true,
          updatedAt: true,
        }
      });

      console.log('User updated successfully:', {
        timezone: updatedUser.timezone,
        timeFormat: updatedUser.timeFormat
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
            timeFormat: updatedUser.timeFormat || '24',
            updatedAt: updatedUser.updatedAt
          },
          error: null
        },
        { status: 200 }
      );
    } catch (dbError: any) {
      console.error('Database update error:', dbError);
      if (dbError.message && dbError.message.includes('timeFormat')) {
        return NextResponse.json(
          {
            error: 'Time format field not found in database. Please run database migration.',
            success: false,
            data: null
          },
          { status: 500 }
        );
      }
      throw dbError;
    }

  } catch (error) {
    console.error('Timezone update error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update timezone: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
