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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      totalUsers,
      totalServices,
      totalCategories,
      revenueResult,
      recentOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      partialOrders,
      todaysOrders,
      todaysProfitResult,
      newUsersToday,
      dailyOrders,
      totalPaymentsResult,
      last30DaysRevenueResult
    ] = await Promise.all([
      db.newOrders.count(),
      db.users.count({ where: { role: 'user' } }),
      db.services.count(),
      db.categories.count(),
      db.newOrders.aggregate({
        where: { status: { in: ['completed', 'processing'] } },
        _sum: { usdPrice: true }
      }),
      db.newOrders.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          service: { select: { name: true } }
        }
      }),
      db.newOrders.count({ where: { status: 'pending' } }),
      db.newOrders.count({ where: { status: 'processing' } }),
      db.newOrders.count({ where: { status: 'completed' } }),
      db.newOrders.count({ where: { status: 'cancelled' } }),
      db.newOrders.count({ where: { status: 'partial' } }),
      db.newOrders.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } }
      }),
      db.newOrders.aggregate({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { in: ['completed', 'processing'] }
        },
        _sum: { profit: true }
      }),
      db.users.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          role: 'user'
        }
      }),
      db.newOrders.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: { createdAt: { gte: lastWeek } },
        orderBy: { createdAt: 'asc' }
      }),
      db.addFunds.aggregate({
        where: { status: 'Success' },
        _sum: { amount: true }
      }),
      db.newOrders.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['completed', 'processing'] }
        },
        _sum: { usdPrice: true }
      })
    ]);

    const totalRevenue = Number(revenueResult._sum.usdPrice ?? 0);
    const todaysProfit = Number(todaysProfitResult._sum.profit ?? 0);
    const totalPayments = totalPaymentsResult._sum.amount
      ? (typeof totalPaymentsResult._sum.amount === 'object' && totalPaymentsResult._sum.amount !== null
          ? Number(totalPaymentsResult._sum.amount)
          : Number(totalPaymentsResult._sum.amount))
      : 0;
    const last30DaysRevenue = Number(last30DaysRevenueResult._sum.usdPrice ?? 0);

    const formattedDailyOrders = dailyOrders.map(order => ({
      date: order.createdAt.toISOString().split('T')[0],
      orders: typeof order._count.id === 'bigint' ? Number(order._count.id) : order._count.id
    }));

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
