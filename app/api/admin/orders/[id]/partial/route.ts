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
          error: 'Unauthorized access. Admin or Moderator privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { notGoingAmount } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Order ID is required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        {
          error: 'Invalid Order ID format',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (!notGoingAmount || isNaN(parseInt(notGoingAmount)) || parseInt(notGoingAmount) < 0) {
      return NextResponse.json(
        {
          error: 'Valid not going amount is required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const order = await db.newOrders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            currency: true,
            dollarRate: true,
            total_spent: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        {
          error: 'Order not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    const notGoingQty = parseInt(notGoingAmount);
    
    if (notGoingQty >= Number(order.qty)) {
      return NextResponse.json(
        {
          error: 'Not going amount cannot be greater than or equal to order quantity',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }
    
    const orderPrice = order.user.currency === 'USD' 
      ? order.usdPrice 
      : order.usdPrice * (order.user.dollarRate || 121.52);
    const pricePerUnit = orderPrice / Number(order.qty);
    const refundAmount = pricePerUnit * notGoingQty;
    const newCharge = orderPrice - refundAmount;
    const newQuantity = Number(order.qty) - notGoingQty;

    const result = await db.$transaction(async (prisma) => {
      if (refundAmount > 0) {
        await prisma.users.update({
          where: { id: order.user.id },
          data: {
            balance: {
              increment: refundAmount
            },
            total_spent: {
              decrement: refundAmount
            }
          }
        });
      }

      const updatedOrder = await prisma.newOrders.update({
        where: { id: orderId },
        data: {
          status: 'partial',
          remains: BigInt(notGoingQty),
          price: newCharge,
          qty: BigInt(newQuantity),
          charge: newCharge,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              balance: true,
              currency: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              rate: true
            }
          },
          category: {
            select: {
              id: true,
              category_name: true
            }
          }
        }
      });

      return updatedOrder;
    });

    console.log(`Admin ${session.user.email} marked order ${id} as partial`, {
      orderId: id,
      userId: order.user.id,
      notGoingAmount: notGoingQty,
      refundAmount,
      previousStatus: order.status,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Order marked as partial. ${refundAmount.toFixed(2)} ${order.user.currency} refunded to user.`,
      data: serializeOrder(result),
      error: null
    });

  } catch (error) {
    console.error('Error marking order as partial:', error);
    return NextResponse.json(
      {
        error: 'Failed to mark order as partial: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

