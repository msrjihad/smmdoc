import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { convertFromUSD, fetchCurrencyData } from '@/lib/currency-utils';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
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

    const { id  } = await params;
    const body = await req.json();
    const { action, reason } = body;

    if (!id) {
      return NextResponse.json(
        { 
          error: 'Task ID is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { 
          error: 'Valid action (approve/reject) is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const taskParts = id.split('_');
    if (taskParts.length < 2) {
      return NextResponse.json(
        { 
          error: 'Invalid task ID format',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const taskType = taskParts[0];
    const orderId = taskParts[1];

    const order = await db.newOrders.findUnique({
      where: { id: Number(orderId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            currency: true,
            dollarRate: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true,
            min_order: true,
            max_order: true,
            status: true
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

    let result;

    if (action === 'approve') {
      if (taskType === 'refill') {
        const refillQuantity = Number(order.remains || order.qty);
        const refillPrice = (refillQuantity / Number(order.qty)) * order.price;
        const refillUsdPrice = (refillQuantity / Number(order.qty)) * order.usdPrice;
        const { currencies } = await fetchCurrencyData();
        
        const requiredAmount = order.user.currency === 'USD' || order.user.currency === 'USDT' 
          ? refillUsdPrice 
          : convertFromUSD(refillUsdPrice, order.user.currency, currencies);
        
        const userBalance = order.user.balance;

        if (userBalance < requiredAmount) {
          return NextResponse.json(
            { 
              error: `Insufficient balance. Required: ${requiredAmount.toFixed(2)} ${order.user.currency}, Available: ${userBalance.toFixed(2)} ${order.user.currency}`,
              success: false,
              data: null 
            },
            { status: 400 }
          );
        }

        result = await db.$transaction(async (prisma) => {
          const refillOrder = await prisma.newOrders.create({
            data: {
              userId: order.userId,
              categoryId: order.categoryId,
              serviceId: order.serviceId,
              link: order.link,
              qty: refillQuantity,
              price: refillPrice,
              usdPrice: refillUsdPrice,
              currency: order.currency,
              avg_time: order.avg_time,
              status: 'processing',
              remains: refillQuantity,
              startCount: 0
            }
          });

          await prisma.users.update({
            where: { id: order.userId },
            data: {
              balance: {
                decrement: requiredAmount
              },
              total_spent: {
                increment: requiredAmount
              }
            }
          });

          return refillOrder;
        });

        console.log(`Admin ${session.user.email} approved refill task for order ${orderId}`, {
          taskId: id,
          orderId,
          refillOrderId: result.id,
          refillQuantity,
          refillPrice,
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString()
        });

      } else if (taskType === 'cancel') {
        const refundAmount = order.user.currency === 'USD' ? order.usdPrice : order.usdPrice * (order.user.dollarRate || 121.52);

        result = await db.$transaction(async (prisma) => {
          const cancelledOrder = await prisma.newOrders.update({
            where: { id: Number(orderId) },
            data: {
              status: 'cancelled',
              updatedAt: new Date()
            }
          });

          if (order.status !== 'pending') {
            await prisma.users.update({
              where: { id: order.userId },
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

          return cancelledOrder;
        });

        console.log(`Admin ${session.user.email} approved cancel task for order ${orderId}`, {
          taskId: id,
          orderId,
          refundAmount: order.status !== 'pending' ? refundAmount : 0,
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString()
        });
      }
    } else if (action === 'reject') {
      console.log(`Admin ${session.user.email} rejected ${taskType} task for order ${orderId}`, {
        taskId: id,
        orderId,
        reason: reason || 'No reason provided',
        timestamp: new Date().toISOString()
      });

      result = { message: `${taskType} request rejected` };
    }

    return NextResponse.json({
      success: true,
      data: {
        task: {
          id,
          orderId,
          type: taskType,
          action,
          processedBy: session.user.email,
          processedAt: new Date().toISOString(),
          reason: reason || 'No reason provided'
        },
        result,
        message: `${taskType} task ${action}d successfully`
      },
      error: null
    });

  } catch (error) {
    console.error('Error processing refill/cancel task:', error);
    return NextResponse.json(
      {
        error: 'Failed to process task: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
