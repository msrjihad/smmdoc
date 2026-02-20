import { auth } from '@/auth';
import { ActivityLogger, getClientIP } from '@/lib/activity-logger';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sendApiKeyChangedNotification } from '@/lib/notifications/user-notifications';

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

    const existingUser = await db.users.findUnique({
      where: { id: Number(id) },
      select: { id: true, username: true, email: true, apiKey: true }
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

    const apiKey = `${crypto.randomBytes(16).toString('hex')}`;

    const updatedUser = await db.users.update({
      where: { id: Number(id) },
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
      const username = existingUser.username || existingUser.email?.split('@')[0] || `user${existingUser.id}`;
      const ipAddress = getClientIP(req);
      await ActivityLogger.apiKeyGenerated(
        existingUser.id,
        username,
        ipAddress
      );
    } catch (error) {
      console.error('Failed to log API key generation activity:', error);
    }

    sendApiKeyChangedNotification(existingUser.id, true).catch(err => {
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
          userId: existingUser.id.toString()
        },
        error: null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error generating API key:', error);
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

    const { id  } = await params;

    const existingUser = await db.users.findUnique({
      where: { id: Number(id) },
      select: { id: true, username: true, apiKey: true }
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
      where: { id: Number(id) },
      data: { apiKey: null },
      select: {
        id: true,
        username: true,
        email: true,
        apiKey: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'API key removed successfully',
      error: null
    });

  } catch (error) {
    console.error('Error removing API key:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove API key: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
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

    const user = await db.users.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        username: true,
        email: true,
        apiKey: true,
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

    const responseData = {
      ...user,
      apiKey: user.apiKey ? `${user.apiKey.substring(0, 8)}...${user.apiKey.substring(user.apiKey.length - 8)}` : null,
      hasApiKey: !!user.apiKey
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      error: null
    });

  } catch (error) {
    console.error('Error fetching user API key:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch API key: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
