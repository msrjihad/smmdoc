import { auth } from '@/auth';
import { db } from '@/lib/db';
import { convertCurrency, fetchCurrencyData } from '@/lib/currency-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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
    const { refundType, refundAmount } = await req.json();

    if (!['partial', 'full'].includes(refundType)) {
      return NextResponse.json(
        {
          error: 'Invalid refund type. Must be "partial" or "full"',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingOrder = await db.newOrders.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            currency: true
          }
        }
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          error: 'Order not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    if (['refunded', 'cancelled'].includes(existingOrder.status)) {
      return NextResponse.json(
        {
          error: 'Order has already been refunded or cancelled',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    let finalRefundAmount: number;
    if (refundType === 'full') {
      finalRefundAmount = existingOrder.price;
    } else {
      if (refundAmount && refundAmount > 0) {
        finalRefundAmount = Math.min(refundAmount, existingOrder.price);
      } else {
        const completedPercentage = ((Number(existingOrder.qty) - Number(existingOrder.remains)) / Number(existingOrder.qty)) * 100;
        const refundPercentage = Math.max(0, 100 - completedPercentage);
        finalRefundAmount = (existingOrder.price * refundPercentage) / 100;
      }
    }

    const result = await db.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: existingOrder.user.id },
        data: {
          balance: {
            increment: finalRefundAmount
          }
        }
      });

      const updatedOrder = await tx.newOrders.update({
        where: { id: Number(id) },
        data: { 
          status: refundType === 'full' ? 'refunded' : 'partial',
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              balance: true
            }
          },
          service: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      const { currencies } = await fetchCurrencyData();
      const refundAmountBDT = convertCurrency(finalRefundAmount, 'USD', 'BDT', currencies);

      await tx.addFunds.create({
        data: {
          userId: existingOrder.user.id,
          invoiceId: `refund_${id}_${Date.now()}`,
          amount: finalRefundAmount.toString(),
          gatewayAmount: refundAmountBDT,
          email: existingOrder.user.email || '',
          name: existingOrder.user.name || 'User',
          status: 'Success',
          paymentGateway: 'Admin Refund',
          paymentMethod: 'Refund',
        }
      });

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `${refundType === 'full' ? 'Full' : 'Partial'} refund of $${finalRefundAmount.toFixed(2)} processed successfully`,
      refundAmount: finalRefundAmount,
      error: null
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      {
        error: 'Failed to process refund: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
