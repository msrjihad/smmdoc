import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || '';
    const serviceId = searchParams.get('serviceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = {
      userId: parseInt(session.user.id),
    };

    if (status && status !== 'all') {
      if (status === 'pending') {
        whereClause.status = {
          in: ['pending', 'failed']
        };
      } else {
        whereClause.status = status;
      }
    }

    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (search) {
      const searchLower = search.toLowerCase();
      whereClause.OR = [
        {
          id: {
            equals: isNaN(parseInt(search)) ? undefined : parseInt(search)
          }
        },
        { link: { contains: search } },
        {
          service: {
            name: { contains: search }
          }
        },
        {
          category: {
            category_name: { contains: search }
          }
        }
      ].filter(condition => {
        return Object.values(condition)[0] !== undefined;
      });
    }

    const totalOrders = await db.newOrders.count({
      where: whereClause
    });

    const orders = await db.newOrders.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            rate: true,
            min_order: true,
            max_order: true,
            avg_time: true,
            status: true,
            refill: true,
            cancel: true,
            refillDays: true
          }
        },
        category: {
          select: {
            id: true,
            category_name: true
          }
        },
        user: {
          select: {
            dollarRate: true
          }
        },
        cancelRequests: {
          select: {
            id: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const transformedOrders = orders.map(order => ({
      ...order,
      status: order.status === 'failed' ? 'pending' : order.status,
      qty: typeof order.qty === 'bigint' ? order.qty.toString() : order.qty,
      remains: typeof order.remains === 'bigint' ? order.remains.toString() : order.remains,
      startCount: typeof order.startCount === 'bigint' ? order.startCount.toString() : order.startCount,
      minQty: order.minQty && typeof order.minQty === 'bigint' ? order.minQty.toString() : order.minQty,
      maxQty: order.maxQty && typeof order.maxQty === 'bigint' ? order.maxQty.toString() : order.maxQty,
      service: order.service ? {
        ...order.service,
        min_order: typeof order.service.min_order === 'bigint' ? order.service.min_order.toString() : order.service.min_order,
        max_order: typeof order.service.max_order === 'bigint' ? order.service.max_order.toString() : order.service.max_order,
      } : order.service,
    }));

    const stats = await db.newOrders.aggregate({
      where: { userId: parseInt(session.user.id) },
      _count: {
        id: true
      },
      _sum: {
        price: true
      }
    });

    const statusCounts = await db.newOrders.groupBy({
      by: ['status'],
      where: { userId: parseInt(session.user.id) },
      _count: {
        status: true
      }
    });

    const transformedStatusBreakdown = statusCounts.reduce((acc, item) => {
      if (item.status === 'failed') {
        acc['pending'] = (acc['pending'] || 0) + item._count.status;
      } else {
        acc[item.status] = item._count.status;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalPages = Math.ceil(totalOrders / limit);

    return NextResponse.json(
      {
        success: true,
        data: transformedOrders,
        pagination: {
          total: totalOrders,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats: {
          totalOrders: stats._count.id,
          totalSpent: stats._sum.price || 0,
          statusBreakdown: transformedStatusBreakdown
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
