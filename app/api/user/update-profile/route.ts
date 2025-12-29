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
    const { fullName, email, username } = body;

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

    if (username !== undefined && username !== existingUser.username) {
      const usernameExists = await db.users.findFirst({
        where: {
          username: username,
          id: { not: session.user.id }
        }
      });

      if (usernameExists) {
        return NextResponse.json(
          {
            error: 'Username already exists. Please choose a different username.',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }

    if (email !== undefined && email !== existingUser.email) {
      const emailExists = await db.users.findFirst({
        where: {
          email: email,
          id: { not: session.user.id }
        }
      });

      if (emailExists) {
        return NextResponse.json(
          {
            error: 'Email already exists. Please choose a different email address.',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    
    if (fullName !== undefined) updateData.name = fullName;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;

    const updatedUser = await db.users.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        emailVerified: true,
        updatedAt: true,
      }
    });

    try {
      const username = session.user.username || session.user.email?.split('@')[0] || `user${session.user.id}`;
      await ActivityLogger.profileUpdated(
        session.user.id,
        username,
        Object.keys(updateData).join(', ')
      );
    } catch (error) {
      console.error('Failed to log profile update activity:', error);
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
      error: null
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
