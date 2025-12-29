import { auth } from '@/auth';
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
    const { discount } = body;

    if (discount === undefined || isNaN(parseFloat(discount))) {
      return NextResponse.json(
        {
          error: 'Valid discount percentage is required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const discountValue = parseFloat(discount);

    if (discountValue < 0 || discountValue > 100) {
      return NextResponse.json(
        {
          error: 'Discount must be between 0 and 100 percent',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingUser = await db.users.findUnique({
      where: { id: userId },
      select: { id: true, username: true, servicesDiscount: true }
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
      where: { id: userId },
      data: { servicesDiscount: discountValue },
      select: {
        id: true,
        username: true,
        email: true,
        servicesDiscount: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User services discount updated to ${discountValue}% successfully`,
      error: null
    });

  } catch (error) {
    console.error('Error updating user discount:', error);
    return NextResponse.json(
      {
        error: 'Failed to update discount: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
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
        servicesDiscount: true,
        specialPricing: true,
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
    console.error('Error fetching user discount:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch discount: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
