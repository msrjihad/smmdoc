import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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

    
    const orders = await db.newOrders.findMany({
      where: {
        OR: [
          { status: 'completed' },
          { status: 'partial' },
          { status: 'processing' },
          { status: 'pending' },
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            currency: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true,
          }
        },
        category: {
          select: {
            id: true,
            category_name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    const tasks = [];

    for (const order of orders) {
      if (['completed', 'partial'].includes(order.status) && (order.service as any)?.status === 'active') {
        tasks.push({
          id: `refill_${order.id}`,
          originalOrderId: order.id,
          originalOrder: order,
          type: 'refill' as const,
          status: 'pending' as const,
          reason: order.status === 'partial' ? 'Partial delivery - refill remaining quantity' : 'Service delivery completed - refill available',
          refillType: order.status === 'partial' ? 'remaining' : 'full',
          customQuantity: order.status === 'partial' ? order.remains : order.qty,
          processedBy: undefined,
          createdAt: new Date(order.updatedAt).toISOString(),
          updatedAt: new Date(order.updatedAt).toISOString(),
        });
      }

      if (['pending', 'processing', 'in_progress'].includes(order.status)) {
        const progress = Number(order.qty) > 0 ? ((Number(order.qty) - Number(order.remains)) / Number(order.qty)) * 100 : 0;
        let refundType = 'full';
        let customRefundAmount = order.price;

        if (order.status === 'processing' && progress > 0) {
          refundType = 'partial';
          customRefundAmount = order.price * 0.8;
        } else if (order.status === 'in_progress') {
          refundType = 'partial';
          customRefundAmount = order.price * Math.max(0.5, (100 - progress) / 100);
        }

        tasks.push({
          id: `cancel_${order.id}`,
          originalOrderId: order.id,
          originalOrder: order,
          type: 'cancel' as const,
          status: 'pending' as const,
          reason: `Order cancellation requested - Status: ${order.status}`,
          refundType,
          customRefundAmount,
          processedBy: undefined,
          createdAt: new Date(order.createdAt).toISOString(),
          updatedAt: new Date(order.updatedAt).toISOString(),
        });
      }
    }

    const cancelTasks = tasks.filter(t => t.type === 'cancel');
    const refillTasks = tasks.filter(t => t.type === 'refill');

    const stats = {
      totalCancellations: cancelTasks.length,
      pendingCancellations: cancelTasks.filter(t => t.status === 'pending').length,
      completedCancellations: cancelTasks.filter(t => (t as any).status === 'completed').length,
      refundProcessed: cancelTasks.filter(t => ['completed', 'refunded'].includes(t.status)).length,
      totalRefillRequests: refillTasks.length,
      pendingRefills: refillTasks.filter(t => t.status === 'pending').length,
      completedRefills: refillTasks.filter(t => (t as any).status === 'completed').length,
      totalRefundAmount: cancelTasks
        .filter(t => ['completed', 'refunded'].includes(t.status))
        .reduce((sum, t) => sum + (t.customRefundAmount || t.originalOrder.price), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        stats,
        total: tasks.length,
        message: 'Refill and cancel tasks retrieved successfully'
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching refill/cancel tasks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch refill and cancel tasks: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
