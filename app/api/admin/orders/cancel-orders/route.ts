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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: {
        in: ['pending', 'processing', 'in_progress']
      }
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          id: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          service: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const [orders, totalCount] = await Promise.all([
      db.newOrders.findMany({
        where: whereClause,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.newOrders.count({
        where: whereClause
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const stats = await db.newOrders.aggregate({
      where: {
        status: {
          in: ['pending', 'processing', 'in_progress']
        }
      },
      _count: {
        id: true
      },
      _sum: {
        price: true
      }
    });

    const statusBreakdown = await db.newOrders.groupBy({
      by: ['status'],
      where: {
        status: {
          in: ['pending', 'processing', 'in_progress']
        }
      },
      _count: {
        status: true
      }
    });

    const totalRefundValue = orders.reduce((sum, order) => {
      const progress = Number(order.qty) > 0 ? ((Number(order.qty) - Number(order.remains)) / Number(order.qty)) * 100 : 0;
      let refundPercentage = 1;
      
      if (order.status === 'processing' && progress > 0) {
        refundPercentage = 0.8;
      } else if (order.status === 'in_progress') {
        refundPercentage = Math.max(0.5, (100 - progress) / 100);
      }
      
      return sum + (order.price * refundPercentage);
    }, 0);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        totalCancellable: stats._count.id,
        totalValue: stats._sum.price || 0,
        totalRefundValue: totalRefundValue,
        pending: statusBreakdown.find(s => s.status === 'pending')?._count.status || 0,
        processing: statusBreakdown.find(s => s.status === 'processing')?._count.status || 0,
        inProgress: statusBreakdown.find(s => s.status === 'in_progress')?._count.status || 0
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching cancellation-eligible orders:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching cancellation-eligible orders',
        success: false,
        data: null 
      },
      { status: 500 }
    );
  }
}
