import { requireAdminOrModerator } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertBigIntToNumber(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
}

export async function GET() {
  try {
    const session = await requireAdminOrModerator();

    const totalOrders = await db.newOrders.count();

    const totalUsers = await db.users.count({
      where: { role: 'user' }
    });

    const totalServices = await db.services.count();

    const totalCategories = await db.categories.count();

    const orders = await db.newOrders.findMany({
      where: {
        status: {
          in: ['completed', 'processing']
        }
      },
      select: {
        usdPrice: true
      }
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.usdPrice, 0);

    const recentOrders = await db.newOrders.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    });

    const pendingOrders = await db.newOrders.count({
      where: { status: 'pending' }
    });

    const processingOrders = await db.newOrders.count({
      where: { status: 'processing' }
    });

    const completedOrders = await db.newOrders.count({
      where: { status: 'completed' }
    });

    const cancelledOrders = await db.newOrders.count({
      where: { status: 'cancelled' }
    });

    const partialOrders = await db.newOrders.count({
      where: { status: 'partial' }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysOrders = await db.newOrders.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    const todaysOrdersWithProfit = await db.newOrders.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        },
        status: {
          in: ['completed', 'processing']
        }
      },
      select: {
        profit: true
      }
    });

    const todaysProfit = todaysOrdersWithProfit.reduce((acc, order) => acc + (order.profit || 0), 0);

    const newUsersToday = await db.users.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        },
        role: 'user'
      }
    });

    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    const dailyOrders = await db.newOrders.groupBy({
      by: ['createdAt'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: lastWeek
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedDailyOrders = dailyOrders.map(order => ({
      date: order.createdAt.toISOString().split('T')[0],
      orders: typeof order._count.id === 'bigint' ? Number(order._count.id) : order._count.id
    }));

    const totalPaymentsResult = await db.addFunds.aggregate({
      where: {
        status: 'Success'
      },
      _sum: {
        usdAmount: true
      }
    });

    const totalPayments = totalPaymentsResult._sum.usdAmount
      ? (typeof totalPaymentsResult._sum.usdAmount === 'object' && totalPaymentsResult._sum.usdAmount !== null
          ? Number(totalPaymentsResult._sum.usdAmount)
          : Number(totalPaymentsResult._sum.usdAmount))
      : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const last30DaysOrders = await db.newOrders.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        status: {
          in: ['completed', 'processing']
        }
      },
      select: {
        usdPrice: true
      }
    });

    const last30DaysRevenue = last30DaysOrders.reduce((acc, order) => acc + order.usdPrice, 0);

    const responseData = {
      success: true,
      data: {
        totalOrders: typeof totalOrders === 'bigint' ? Number(totalOrders) : totalOrders,
        totalUsers: typeof totalUsers === 'bigint' ? Number(totalUsers) : totalUsers,
        totalServices: typeof totalServices === 'bigint' ? Number(totalServices) : totalServices,
        totalCategories: typeof totalCategories === 'bigint' ? Number(totalCategories) : totalCategories,
        totalRevenue,
        totalPayments,
        last30DaysRevenue,
        recentOrders,
        ordersByStatus: {
          pending: typeof pendingOrders === 'bigint' ? Number(pendingOrders) : pendingOrders,
          processing: typeof processingOrders === 'bigint' ? Number(processingOrders) : processingOrders,
          completed: typeof completedOrders === 'bigint' ? Number(completedOrders) : completedOrders,
          cancelled: typeof cancelledOrders === 'bigint' ? Number(cancelledOrders) : cancelledOrders,
          partial: typeof partialOrders === 'bigint' ? Number(partialOrders) : partialOrders
        },
        dailyOrders: formattedDailyOrders,
        todaysOrders: typeof todaysOrders === 'bigint' ? Number(todaysOrders) : todaysOrders,
        todaysProfit,
        newUsersToday: typeof newUsersToday === 'bigint' ? Number(newUsersToday) : newUsersToday
      }
    };

    const serializedData = convertBigIntToNumber(responseData);

    return NextResponse.json(serializedData, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching dashboard stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
