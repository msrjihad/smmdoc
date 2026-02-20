import { auth } from '@/auth';
import { db } from '@/lib/db';
import { serializeOrder } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json(
        {
          error: 'Unauthorized. Admin or Moderator required.',
          success: false,
          data: null,
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const startCount = body.startCount;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required', success: false, data: null },
        { status: 400 }
      );
    }

    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID', success: false, data: null },
        { status: 400 }
      );
    }

    if (startCount === undefined || startCount === null) {
      return NextResponse.json(
        { error: 'Start count is required', success: false, data: null },
        { status: 400 }
      );
    }

    const startCountNum = typeof startCount === 'number' ? startCount : parseInt(String(startCount), 10);
    if (isNaN(startCountNum) || startCountNum < 0) {
      return NextResponse.json(
        { error: 'Start count must be a non-negative number', success: false, data: null },
        { status: 400 }
      );
    }

    const order = await db.newOrders.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, rate: true } },
        category: { select: { id: true, category_name: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found', success: false, data: null },
        { status: 404 }
      );
    }

    const updatedOrder = await db.newOrders.update({
      where: { id: orderId },
      data: {
        startCount: BigInt(startCountNum),
        updatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true, rate: true } },
        category: { select: { id: true, category_name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Start count updated successfully',
      data: serializeOrder(updatedOrder),
    });
  } catch (error) {
    console.error('Error updating start count:', error);
    return NextResponse.json(
      {
        error: 'Failed to update start count: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null,
      },
      { status: 500 }
    );
  }
}
