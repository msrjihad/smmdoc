import { auth } from '@/auth';
import { db } from '@/lib/db';
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
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { reason, refundType = 'full', customRefundAmount } = body;
    
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
    
    const order = await db.newOrders.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            currency: true,
            total_spent: true,
            dollarRate: true
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
    
    const cancellableStatuses = ['pending', 'processing', 'in_progress', 'partial'];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { 
          error: `Order cannot be cancelled. Current status: ${order.status}. Cancellable statuses: ${cancellableStatuses.join(', ')}`,
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    let refundAmount: number;
    const orderPrice = order.user.currency === 'USD' ? order.usdPrice : order.usdPrice * (order.user.dollarRate || 121.52);
    
    switch (refundType) {
      case 'full':
        refundAmount = orderPrice;
        break;
      case 'partial':
        const deliveredPercentage = Number(order.qty) > 0 ? (Number(order.qty) - Number(order.remains)) / Number(order.qty) : 0;
        refundAmount = orderPrice * (Number(order.remains) / Number(order.qty));
        break;
      case 'none':
        refundAmount = 0;
        break;
      case 'custom':
        if (customRefundAmount === undefined || customRefundAmount < 0) {
          return NextResponse.json(
            { 
              error: 'Custom refund amount must be provided and non-negative',
              success: false,
              data: null 
            },
            { status: 400 }
          );
        }
        refundAmount = parseFloat(customRefundAmount);
        if (refundAmount > orderPrice) {
          return NextResponse.json(
            { 
              error: `Refund amount cannot exceed order price (${orderPrice.toFixed(2)})`,
              success: false,
              data: null 
            },
            { status: 400 }
          );
        }
        break;
      default:
        return NextResponse.json(
          { 
            error: 'Invalid refund type. Must be: full, partial, none, or custom',
            success: false,
            data: null 
          },
          { status: 400 }
        );
    }
    
    const result = await db.$transaction(async (prisma) => {
      const cancelledOrder = await prisma.newOrders.update({
        where: { id: Number(id) },
        data: {
          status: 'cancelled',
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              currency: true,
              balance: true
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
      
      let updatedUser = null;
      if (refundAmount > 0) {
        const spentAmount = order.status === 'pending' ? 0 : orderPrice;
        const spentAdjustment = Math.min(spentAmount, refundAmount);
        
        updatedUser = await prisma.users.update({
          where: { id: order.userId },
          data: {
            balance: {
              increment: refundAmount
            },
            total_spent: {
              decrement: spentAdjustment
            }
          },
          select: {
            id: true,
            balance: true,
            total_spent: true
          }
        });
      }
      
      try {
        const commission = await prisma.affiliateCommissions.findFirst({
          where: { orderId: Number(id) },
          include: {
            affiliate: {
              select: {
                id: true,
                status: true,
              }
            }
          }
        });

        if (commission && commission.status === 'pending') {
          await prisma.affiliateCommissions.update({
            where: { id: commission.id },
            data: {
              status: 'cancelled',
              updatedAt: new Date(),
            }
          });
          console.log(`Affiliate commission ${commission.id} marked as cancelled for cancelled order ${id}`);
        }
      } catch (affiliateError) {
        console.error('Error updating affiliate commission status:', affiliateError);
      }

      return { cancelledOrder, updatedUser, refundAmount };
    });
    
    console.log(`Admin ${session.user.email} cancelled order ${id}`, {
      orderId: id,
      userId: order.userId,
      originalStatus: order.status,
      refundType,
      refundAmount,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: `Order cancelled successfully${refundAmount > 0 ? ` with ${refundAmount.toFixed(2)} ${order.user.currency} refund` : ''}`,
      data: {
        order: result.cancelledOrder,
        refund: {
          amount: refundAmount,
          currency: order.user.currency,
          type: refundType,
          processed: refundAmount > 0
        },
        user: result.updatedUser ? {
          id: result.updatedUser.id,
          newBalance: result.updatedUser.balance,
          newTotalSpent: result.updatedUser.total_spent
        } : null,
        cancellation: {
          reason: reason || 'Admin cancelled order',
          timestamp: new Date().toISOString(),
          adminEmail: session.user.email
        }
      },
      error: null
    });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel order: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
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
    
    const order = await db.newOrders.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            currency: true,
            balance: true
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
    
    const cancellableStatuses = ['pending', 'processing', 'in_progress', 'partial'];
    const isCancellable = cancellableStatuses.includes(order.status);
    
    const orderPrice = (order as any).user?.currency === 'USD' ? order.usdPrice : order.usdPrice * ((order as any).user?.dollarRate || 121.52);
    const deliveredQuantity = Number(order.qty) - Number(order.remains);
    const deliveredPercentage = Number(order.qty) > 0 ? deliveredQuantity / Number(order.qty) : 0;
    const partialRefundAmount = orderPrice * (Number(order.remains) / Number(order.qty));
    
    const cancellationInfo = {
      eligible: isCancellable,
      reason: !isCancellable ? `Order status '${order.status}' is not cancellable. Cancellable statuses: ${cancellableStatuses.join(', ')}` : null,
      order: {
        id: order.id,
        status: order.status,
        totalQuantity: order.qty,
        deliveredQuantity,
        remainingQuantity: order.remains,
        deliveredPercentage: Math.round(deliveredPercentage * 100),
        orderPrice,
        currency: (order as any).user?.currency || 'USD'
      },
      refundOptions: {
        full: {
          amount: orderPrice,
          description: 'Refund full order amount'
        },
        partial: {
          amount: partialRefundAmount,
          description: `Refund for undelivered quantity (${order.remains}/${order.qty})`
        },
        none: {
          amount: 0,
          description: 'No refund'
        },
        custom: {
          maxAmount: orderPrice,
          description: 'Custom refund amount (up to full order price)'
        }
      }
    };
    
    return NextResponse.json({
      success: true,
      data: cancellationInfo,
      error: null
    });
    
  } catch (error) {
    console.error('Error fetching cancellation info:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cancellation info: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
