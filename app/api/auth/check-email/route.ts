import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          error: 'Email is required',
          success: false,
          available: false
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: 'Invalid email format',
          success: false,
          available: false
        },
        { status: 400 }
      );
    }

    const existingUser = await db.users.findUnique({
      where: { email: email },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Email is already taken',
          success: false,
          available: false
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Email is available',
        success: true,
        available: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check email availability',
        success: false,
        available: false 
      },
      { status: 500 }
    );
  }
}
