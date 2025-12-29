import { auth } from '@/auth';
import { db } from '@/lib/db';
import { serializeOrder } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { updateAffiliateCommissionForOrder } from '@/lib/affiliate-commission-helper';

export async function PUT(
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
    const { status, reason, startCount, remains } = body;
    
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
    
    console.log('Order ID received:', id, 'Type:', typeof id);
    const orderId = parseInt(id);
    console.log('Parsed Order ID:', orderId, 'isNaN:', isNaN(orderId));
    if (isNaN(orderId)) {
      return NextResponse.json(
        {
          error: `Invalid Order ID format. Received: ${id}`,
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
    
    if (!currentOrder) {
      console.log('Order not found with ID:', orderId);
      return NextResponse.json(
        {
          error: `Order not found with ID: ${orderId}`,
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    console.log('Found order:', { id: currentOrder.id, status: currentOrder.status });
    
    const user = currentOrder.user;
    const orderPrice = user.currency === 'USD' ? currentOrder.usdPrice : currentOrder.usdPrice * (user.dollarRate || 121.52);
    
    let balanceUpdate = null;
    
    if (currentOrder.status === 'pending' && ['processing', 'in_progress', 'completed', 'partial'].includes(status)) {
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
      
      balanceUpdate = {
        balance: {
          decrement: orderPrice
        },
        total_spent: {
          increment: orderPrice
        }
      };
    }
    
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      console.log(`Processing refund for cancelled order ${orderId}:`, {
        userId: user.id,
        orderPrice,
        userCurrency: user.currency,
        orderUsdPrice: currentOrder.usdPrice,
        userDollarRate: user.dollarRate,
        previousStatus: currentOrder.status,
        previousBalance: user.balance,
        previousTotalSpent: user.total_spent
      });
      
      balanceUpdate = {
        balance: {
          increment: orderPrice
        },
        total_spent: {
          decrement: orderPrice
        }
      };
    }
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'completed') {
      updateData.remains = BigInt(0);
      updateData.startCount = currentOrder.qty || BigInt(0);
    } else {
      if (startCount !== undefined) {
        updateData.startCount = BigInt(startCount.toString());
      }
      
      if (remains !== undefined) {
        updateData.remains = BigInt(remains.toString());
      }
    }
    
    const result = await db.$transaction(async (prisma) => {
      if (balanceUpdate) {
        const updatedUser = await prisma.users.update({
          where: { id: user.id },
          data: balanceUpdate,
          select: {
            id: true,
            balance: true,
            total_spent: true
          }
        });
        
        if (status === 'cancelled') {
          console.log(`Refund processed for cancelled order ${orderId}:`, {
            userId: user.id,
            refundAmount: orderPrice,
            userCurrency: user.currency,
            previousBalance: user.balance,
            newBalance: updatedUser.balance,
            previousTotalSpent: user.total_spent,
            newTotalSpent: updatedUser.total_spent
          });
        }
      }
      
      const updatedOrder = await prisma.newOrders.update({
        where: { id: orderId },
        data: updateData,
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

      try {
        await updateAffiliateCommissionForOrder(orderId, status, prisma);
      } catch (affiliateError) {
        console.error('Error updating affiliate commission status:', affiliateError);
      }
      
      return updatedOrder;
    });
    
    console.log(`Admin ${session.user.email} changed order ${id} status from ${currentOrder.status} to ${status}`, {
      orderId: id,
      userId: user.id,
      previousStatus: currentOrder.status,
      newStatus: status,
      reason: reason || 'No reason provided',
      balanceAdjusted: balanceUpdate !== null,
      timestamp: new Date().toISOString()
    });
    
    
    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: serializeOrder(result),
      error: null
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to update order status: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { status } = await req.json();

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

    const validStatuses = ['pending', 'processing', 'in_progress', 'completed', 'partial', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const updatedOrder = await db.$transaction(async (prisma) => {
      const currentOrder = await prisma.newOrders.findUnique({
        where: { id: orderId },
        select: { qty: true }
      });

      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'completed') {
        updateData.remains = BigInt(0);
        updateData.startCount = currentOrder?.qty || BigInt(0);
      }

      const order = await prisma.newOrders.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
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

      try {
        await updateAffiliateCommissionForOrder(orderId, status, prisma);
      } catch (affiliateError) {
        console.error('Error updating affiliate commission status:', affiliateError);
      }

      return order;
    });

    return NextResponse.json({
      success: true,
      data: serializeOrder(updatedOrder),
      message: `Order status updated to ${status}`,
      error: null
    });

  } catch (error) {
    console.error('Error updating order status (PATCH):', error);
    console.error('Error stack (PATCH):', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to update order status: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        qty: true,
        remains: true,
        startCount: true
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
    
    const qtyNum = typeof order.qty === 'bigint' ? Number(order.qty) : order.qty;
    const remainsNum = typeof order.remains === 'bigint' ? Number(order.remains) : order.remains;
    const progress = qtyNum > 0 ? ((qtyNum - remainsNum) / qtyNum) * 100 : 0;
    
    const statusInfo = {
      currentStatus: order.status,
      progress: Math.round(progress),
      totalQuantity: typeof order.qty === 'bigint' ? order.qty.toString() : order.qty,
      delivered: (qtyNum - remainsNum).toString(),
      remaining: typeof order.remains === 'bigint' ? order.remains.toString() : order.remains,
      startCount: typeof order.startCount === 'bigint' ? order.startCount.toString() : order.startCount,
      createdAt: order.createdAt,
      lastUpdated: order.updatedAt,
      statusHistory: [
        {
          status: 'pending',
          timestamp: order.createdAt,
          note: 'Order created'
        },
        ...(order.status !== 'pending' ? [{
          status: order.status,
          timestamp: order.updatedAt,
          note: `Status changed to ${order.status}`
        }] : [])
      ]
    };
    
    return NextResponse.json({
      success: true,
      data: statusInfo,
      error: null
    });
    
  } catch (error) {
    console.error('Error fetching order status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch order status: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
