import { auth } from '@/auth';
import { db } from '@/lib/db';
import { serializeOrder } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
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

    const { id  } = await params;

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

    const order = await db.newOrders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            currency: true,
            balance: true,
            total_spent: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            rate: true,
            min_order: true,
            max_order: true,
            avg_time: true,
            status: true
          }
        },
        category: {
          select: {
            id: true,
            category_name: true,
            status: true
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
    
    return NextResponse.json({
      success: true,
      data: serializeOrder(order),
      error: null
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch order: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
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

    const { id  } = await params;
    const body = await req.json();

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

    const currentOrder = await db.newOrders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            balance: true,
            currency: true,
            dollarRate: true
          }
        }
      }
    });
    
    if (!currentOrder) {
      return NextResponse.json(
        { 
          error: 'Order not found',
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }
    
    const updateData: any = {};
    
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    
    if (body.remains !== undefined) {
      updateData.remains = BigInt(parseInt(body.remains));
    }
    
    if (body.startCount !== undefined) {
      updateData.startCount = BigInt(parseInt(body.startCount));
    }
    
    if (body.link !== undefined) {
      updateData.link = body.link;
    }
    
    if (body.qty !== undefined) {
      updateData.qty = BigInt(parseInt(body.qty));
      if (updateData.remains === undefined) {
        updateData.remains = BigInt(parseInt(body.qty) - (Number(currentOrder.qty) - Number(currentOrder.remains)));
      }
    }
    
    updateData.updatedAt = new Date();
    
    if (body.status === 'completed') {
      updateData.remains = BigInt(0);
      updateData.startCount = currentOrder.qty || BigInt(0);
    }
    
    if (body.status && body.status !== currentOrder.status) {
      const user = currentOrder.user;
      const orderPrice = user.currency === 'USD' ? currentOrder.usdPrice : currentOrder.usdPrice * (user.dollarRate || 121.52);
      
      if (currentOrder.status === 'pending' && ['processing', 'completed'].includes(body.status)) {
        if (user.balance < orderPrice) {
          return NextResponse.json(
            {
              error: `Insufficient balance to activate order. Required: ${orderPrice.toFixed(2)}, Available: ${user.balance.toFixed(2)}`,
              success: false,
              data: null
            },
            { status: 400 }
          );
        }

        await db.users.update({
          where: { id: user.id },
          data: {
            balance: {
              decrement: orderPrice
            },
            total_spent: {
              increment: orderPrice
            }
          }
        });
      }
      
      if (['processing', 'completed'].includes(currentOrder.status) && ['cancelled', 'refunded'].includes(body.status)) {
        await db.users.update({
          where: { id: user.id },
          data: {
            balance: {
              increment: orderPrice
            },
            total_spent: {
              decrement: orderPrice
            }
          }
        });
      }
    }
    
    const updatedOrder = await db.$transaction(async (prisma) => {
      const order = await prisma.newOrders.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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

      if (body.status && body.status !== currentOrder.status) {
        try {
          const commission = await prisma.affiliateCommissions.findFirst({
            where: { orderId: orderId },
            include: {
              affiliate: {
                select: {
                  id: true,
                  status: true,
                }
              }
            }
          });

          if (commission && commission.affiliate && commission.affiliate.status === 'active') {
            if (body.status === 'cancelled' && commission.status === 'pending') {
              await prisma.affiliateCommissions.update({
                where: { id: commission.id },
                data: {
                  status: 'cancelled',
                  updatedAt: new Date(),
                }
              });
              console.log(`Affiliate commission ${commission.id} marked as cancelled for order ${orderId}`);
            } else if (body.status === 'completed' && commission.status === 'pending') {
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

              console.log(`Affiliate commission ${commission.id} approved and $${commission.commissionAmount.toFixed(2)} added to affiliate ${commission.affiliateId} earnings for completed order ${orderId}`);
            }
          }
        } catch (affiliateError) {
          console.error('Error updating affiliate commission status:', affiliateError);
        }
      }

      return order;
    });
    
    console.log(`Admin ${session.user.email} updated order ${id}`, {
      orderId: id,
      changes: updateData,
      previousStatus: currentOrder.status,
      newStatus: body.status,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: serializeOrder(updatedOrder),
      error: null
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      {
        error: 'Failed to update order: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
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

    const { id  } = await params;

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

    const order = await db.newOrders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            currency: true,
            dollarRate: true
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
    
    if (order.status !== 'pending') {
      const refundAmount = order.user.currency === 'USD' ? order.usdPrice : order.usdPrice * (order.user.dollarRate || 121.52);

      await db.users.update({
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
    
    await db.newOrders.delete({
      where: { id: orderId }
    });

    console.log(`Admin ${session.user.email} deleted order ${orderId}`, {
      orderId: orderId,
      userId: order.userId,
      refunded: order.status !== 'pending',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
      data: null,
      error: null
    });
    
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete order: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
