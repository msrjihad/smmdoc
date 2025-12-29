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
    const period = searchParams.get('period') || 'all';
    const userId = searchParams.get('userId');

    const whereClause: any = {};

    if (period !== 'all') {
      const periodDays = parseInt(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      whereClause.createdAt = {
        gte: startDate
      };
    }

    if (userId) {
      whereClause.userId = userId;
    }
    
    const [
      totalStats,
      statusStats,
      dailyStats,
      topServices,
      topUsers,
      revenueStats
    ] = await Promise.all([
      db.newOrders.aggregate({
        where: whereClause,
        _count: {
          id: true
        },
        _sum: {
          price: true,
          qty: true
        },
        _avg: {
          price: true
        }
      }),
      
      db.newOrders.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          status: true
        },
        _sum: {
          price: true
        }
      }),
      
      period === 'all' ?
        (userId ? 
          db.$queryRaw`
            SELECT
              DATE(createdAt) as date,
              COUNT(*) as orders,
              SUM(price) as revenue,
              COUNT(DISTINCT userId) as unique_users
            FROM new_orders
            WHERE userId = ${userId}
            GROUP BY DATE(createdAt)
            ORDER BY date DESC
            LIMIT 30
          ` :
          db.$queryRaw`
            SELECT
              DATE(createdAt) as date,
              COUNT(*) as orders,
              SUM(price) as revenue,
              COUNT(DISTINCT userId) as unique_users
            FROM new_orders
            GROUP BY DATE(createdAt)
            ORDER BY date DESC
            LIMIT 30
          `
        ) :
        (userId ?
          db.$queryRaw`
            SELECT
              DATE(createdAt) as date,
              COUNT(*) as orders,
              SUM(price) as revenue,
              COUNT(DISTINCT userId) as unique_users
            FROM new_orders
            WHERE createdAt >= ${new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000)}
            AND userId = ${userId}
            GROUP BY DATE(createdAt)
            ORDER BY date DESC
            LIMIT 30
          ` :
          db.$queryRaw`
            SELECT
              DATE(createdAt) as date,
              COUNT(*) as orders,
              SUM(price) as revenue,
              COUNT(DISTINCT userId) as unique_users
            FROM new_orders
            WHERE createdAt >= ${new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000)}
            GROUP BY DATE(createdAt)
            ORDER BY date DESC
            LIMIT 30
          `
        ),
      
      db.newOrders.groupBy({
        by: ['serviceId'],
        where: whereClause,
        _count: {
          serviceId: true
        },
        _sum: {
          price: true,
          qty: true
        },
        orderBy: {
          _count: {
            serviceId: 'desc'
          }
        },
        take: 10
      }),
      
      userId ? [] : db.newOrders.groupBy({
        by: ['userId'],
        where: whereClause,
        _count: {
          userId: true
        },
        _sum: {
          price: true
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 10
      }),
      
      db.newOrders.groupBy({
        by: ['currency'],
        where: whereClause,
        _count: {
          currency: true
        },
        _sum: {
          price: true
        }
      })
    ]);
    
    const serviceIds = topServices.map(s => s.serviceId);
    const services = serviceIds.length > 0 ? await db.services.findMany({
      where: {
        id: {
          in: serviceIds
        }
      },
      select: {
        id: true,
        name: true,
        rate: true,
        category: {
          select: {
            category_name: true
          }
        }
      }
    }) : [];
    
    const userIds = topUsers.map(u => u.userId);
    const users = userIds.length > 0 ? await db.users.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true
      }
    }) : [];
    
    const topServicesWithDetails = topServices.map(stat => {
      const service = services.find(s => s.id === stat.serviceId);
      return {
        ...stat,
        service: service || { id: stat.serviceId, name: 'Unknown Service' }
      };
    });
    
    const topUsersWithDetails = topUsers.map(stat => {
      const user = users.find(u => u.id === stat.userId);
      return {
        ...stat,
        user: user || { id: stat.userId, name: 'Unknown User', email: 'unknown@example.com' }
      };
    });
    
    let orderGrowth = 0;
    let revenueGrowth = 0;
    const periodInfo: any = {
      type: period === 'all' ? 'all-time' : 'period',
      endDate: new Date().toISOString()
    };

    if (period !== 'all') {
      const periodDays = parseInt(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

      periodInfo.days = periodDays;
      periodInfo.startDate = startDate.toISOString();

      const previousPeriodStats = await db.newOrders.aggregate({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          },
          ...(userId && { userId: Number(userId) })
        },
        _count: {
          id: true
        },
        _sum: {
          price: true
        }
      });

      orderGrowth = previousPeriodStats._count.id > 0
        ? ((totalStats._count.id - previousPeriodStats._count.id) / previousPeriodStats._count.id) * 100
        : 0;

      revenueGrowth = (previousPeriodStats._sum.price || 0) > 0
        ? (((totalStats._sum.price || 0) - (previousPeriodStats._sum.price || 0)) / (previousPeriodStats._sum.price || 0)) * 100
        : 0;
    }

    console.log('Total stats:', totalStats);
    console.log('Status stats:', statusStats);

    const convertBigIntToNumber = (value: any): number => {
      return typeof value === 'bigint' ? Number(value) : (value || 0);
    };

    const statistics = {
      period: periodInfo,
      overview: {
        totalOrders: convertBigIntToNumber(totalStats._count.id),
        totalRevenue: convertBigIntToNumber(totalStats._sum.price),
        totalQuantity: convertBigIntToNumber(totalStats._sum.qty),
        averageOrderValue: convertBigIntToNumber(totalStats._avg.price),
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      },
      statusBreakdown: statusStats.map(stat => ({
        status: stat.status,
        count: convertBigIntToNumber(stat._count.status),
        revenue: convertBigIntToNumber(stat._sum.price),
        percentage: totalStats._count.id > 0 ? Math.round((convertBigIntToNumber(stat._count.status) / convertBigIntToNumber(totalStats._count.id)) * 100) : 0
      })),
      dailyTrends: Array.isArray(dailyStats) ? dailyStats.map((stat: any) => ({
        date: stat.date,
        orders: convertBigIntToNumber(stat.orders),
        revenue: convertBigIntToNumber(stat.revenue),
        unique_users: convertBigIntToNumber(stat.unique_users)
      })) : [],
      topServices: topServicesWithDetails.map(stat => ({
        ...stat,
        _count: {
          serviceId: convertBigIntToNumber(stat._count.serviceId)
        },
        _sum: {
          price: convertBigIntToNumber(stat._sum.price),
          qty: convertBigIntToNumber(stat._sum.qty)
        }
      })),
      topUsers: topUsersWithDetails.map(stat => ({
        ...stat,
        _count: {
          userId: convertBigIntToNumber(stat._count.userId)
        },
        _sum: {
          price: convertBigIntToNumber(stat._sum.price)
        }
      })),
      revenueByCurrency: revenueStats.map(stat => ({
        currency: stat.currency,
        orders: convertBigIntToNumber(stat._count.currency),
        revenue: convertBigIntToNumber(stat._sum.price)
      }))
    };
    
    return NextResponse.json({
      success: true,
      data: statistics,
      error: null
    });
    
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch order statistics: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
