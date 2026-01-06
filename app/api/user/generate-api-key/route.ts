import { auth } from '@/auth';
import { ActivityLogger, getClientIP } from '@/lib/activity-logger';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sendApiKeyChangedNotification } from '@/lib/notifications/user-notifications';

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

    const apiKey = `${crypto.randomBytes(16).toString('hex')}`;

    const updatedUser = await db.users.update({
      where: { id: parseInt(session.user.id) },
      data: { 
        apiKey: apiKey,
        updatedAt: new Date()
      },
      select: {
        id: true,
        apiKey: true,
        updatedAt: true,
      }
    });

    try {
      const username = session.user.username || session.user.email?.split('@')[0] || `user${session.user.id}`;
      const ipAddress = getClientIP(req);
      await ActivityLogger.apiKeyGenerated(
        session.user.id,
        username,
        ipAddress
      );
    } catch (error) {
      console.error('Failed to log API key generation activity:', error);
    }

    sendApiKeyChangedNotification(parseInt(session.user.id), false).catch(err => {
      console.error('Failed to send API key changed notification:', err);
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          apiKey: updatedUser.apiKey,
          createdAt: updatedUser.updatedAt,
          updatedAt: updatedUser.updatedAt,
          id: '1',
          userId: session.user.id
        },
        error: null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('API key generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate API key',
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
