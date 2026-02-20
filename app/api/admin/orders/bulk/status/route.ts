import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderStatusChangedNotification } from '@/lib/notifications/user-notifications';

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { orderIds, status } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        {
          error: 'Order IDs array is required and must not be empty',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        {
          error: 'Status is required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'processing', 'in_progress', 'completed', 'partial', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`,
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const orderIdNumbers = orderIds.map(id => parseInt(String(id))).filter(id => !isNaN(id));

    if (orderIdNumbers.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid order IDs provided',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const previousOrders = (status === 'completed' || status === 'cancelled') 
      ? await db.newOrders.findMany({
          where: { id: { in: orderIdNumbers } },
          select: { id: true, userId: true, status: true }
        })
      : [];

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'completed') {
      updateData.remains = BigInt(0);
    }

    if (status === 'cancelled') {
      const orders = await db.newOrders.findMany({
        where: {
          id: { in: orderIdNumbers }
        },
        include: {
          user: {
            select: {
              id: true,
              currency: true,
              dollarRate: true,
              balance: true,
              total_spent: true
            }
          }
        }
      });

      const userRefunds: { [userId: number]: number } = {};
      const userSpentAdjustments: { [userId: number]: number } = {};

      orders.forEach(order => {
        if (order.status !== 'cancelled') {
          const orderPrice = order.user.currency === 'USD' 
            ? order.usdPrice 
            : order.usdPrice * (order.user.dollarRate || 121.52);
          
          if (!userRefunds[order.userId]) {
            userRefunds[order.userId] = 0;
            userSpentAdjustments[order.userId] = 0;
          }
          
          userRefunds[order.userId] += orderPrice;
          userSpentAdjustments[order.userId] += orderPrice;
        }
      });

      await db.$transaction(async (prisma) => {
        for (const [userId, refundAmount] of Object.entries(userRefunds)) {
          const spentAdjustment = userSpentAdjustments[parseInt(userId)];
          
          await prisma.users.update({
            where: { id: parseInt(userId) },
            data: {
              balance: {
                increment: refundAmount
              },
              total_spent: {
                decrement: spentAdjustment
              }
            }
          });
        }

        await prisma.newOrders.updateMany({
          where: {
            id: { in: orderIdNumbers }
          },
          data: updateData
        });

        const commissions = await prisma.affiliateCommissions.findMany({
          where: {
            orderId: { in: orderIdNumbers },
            status: 'pending'
          },
          include: {
            affiliate: {
              select: {
                id: true,
                status: true,
              }
            }
          }
        });

        for (const commission of commissions) {
          if (commission.affiliate && commission.affiliate.status === 'active') {
            await prisma.affiliateCommissions.update({
              where: { id: commission.id },
              data: {
                status: 'cancelled',
                updatedAt: new Date(),
              }
            });
          }
        }
      });
    } else {
      await db.$transaction(async (prisma) => {
        if (status === 'completed') {
          const orders = await prisma.newOrders.findMany({
            where: {
              id: { in: orderIdNumbers }
            },
            select: {
              id: true,
              qty: true
            }
          });
          
          for (const order of orders) {
            await prisma.newOrders.update({
              where: { id: order.id },
              data: {
                ...updateData,
                startCount: order.qty || BigInt(0)
              }
            });
          }
        } else {
          await prisma.newOrders.updateMany({
            where: {
              id: { in: orderIdNumbers }
            },
            data: updateData
          });
        }

        if (status === 'completed') {
          const commissions = await prisma.affiliateCommissions.findMany({
            where: {
              orderId: { in: orderIdNumbers },
              status: 'pending'
            },
            include: {
              affiliate: {
                select: {
                  id: true,
                  status: true,
                }
              }
            }
          });

          for (const commission of commissions) {
            if (commission.affiliate && commission.affiliate.status === 'active') {
              await prisma.affiliateCommissions.update({
                where: { id: commission.id },
                data: {
                  status: 'approved',
                  updatedAt: new Date(),
                }
              });

              await prisma.affiliates.update({
                where: { id: commission.affiliateId },
                data: {
                  totalEarnings: {
                    increment: commission.commissionAmount
                  },
                  availableEarnings: {
                    increment: commission.commissionAmount
                  },
                  updatedAt: new Date(),
                }
              });

              console.log(`Affiliate commission ${commission.id} approved and $${commission.commissionAmount.toFixed(2)} added to affiliate ${commission.affiliateId} earnings for completed order ${commission.orderId}`);
            }
          }
        }
      });
    }

    console.log(`Admin ${session.user.email} bulk updated ${orderIdNumbers.length} orders to status ${status}`, {
      orderIds: orderIdNumbers,
      newStatus: status,
      timestamp: new Date().toISOString()
    });

    if ((status === 'completed' || status === 'cancelled') && previousOrders.length > 0) {
      for (const order of previousOrders) {
        if (order.status !== status) {
          sendOrderStatusChangedNotification(
            order.userId,
            order.id,
            status as 'completed' | 'cancelled'
          ).catch(err => {
            console.error(`Failed to send notification for order ${order.id}:`, err);
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${orderIdNumbers.length} order${orderIdNumbers.length !== 1 ? 's' : ''} to ${status}`,
      data: {
        updatedCount: orderIdNumbers.length,
        status
      },
      error: null
    });

  } catch (error) {
    console.error('Error bulk updating order status:', error);
    return NextResponse.json(
      {
        error: 'Failed to bulk update order status: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

