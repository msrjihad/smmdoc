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
        in: ['completed', 'partial']
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

    const eligibleOrders = orders.filter(order => {
      if (order.service.status !== 'active') return false;
      
      if (order.status === 'partial' && order.remains > 0) return true;
      
      if (order.status === 'completed') return true;
      
      return false;
    });

    const totalPages = Math.ceil(totalCount / limit);

    const stats = await db.newOrders.aggregate({
      where: {
        status: {
          in: ['completed', 'partial']
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
          in: ['completed', 'partial']
        }
      },
      _count: {
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      data: eligibleOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        totalEligible: stats._count.id,
        totalValue: stats._sum.price || 0,
        completed: statusBreakdown.find(s => s.status === 'completed')?._count.status || 0,
        partial: statusBreakdown.find(s => s.status === 'partial')?._count.status || 0
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching refill-eligible orders:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching refill-eligible orders',
        success: false,
        data: null 
      },
      { status: 500 }
    );
  }
}
