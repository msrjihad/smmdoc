import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        {
          error: 'Username is required',
          success: false,
          available: false
        },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        {
          error: 'Username must be at least 3 characters long',
          success: false,
          available: false
        },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error: 'Username can only contain lowercase letters, numbers, dots (.) and underscores (_)',
          success: false,
          available: false
        },
        { status: 400 }
      );
    }

    const existingUser = await db.users.findUnique({
      where: { username: username },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Username is already exist',
          success: false,
          available: false
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Username is available',
        success: true,
        available: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check username availability',
        success: false,
        available: false 
      },
      { status: 500 }
    );
  }
}
