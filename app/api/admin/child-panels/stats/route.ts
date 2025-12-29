import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalPanels,
      activePanels,
      inactivePanels,
      suspendedPanels,
      pendingPanels,
      expiredPanels,
      totalRevenueResult,
      totalOrdersResult,
      apiCallsResult,
      todayApiCallsResult,
    ] = await Promise.all([
      db.childPanels.count(),
      db.childPanels.count({ where: { status: 'active' } }),
      db.childPanels.count({ where: { status: 'inactive' } }),
      db.childPanels.count({ where: { status: 'suspended' } }),
      db.childPanels.count({ where: { status: 'pending' } }),
      db.childPanels.count({ where: { status: 'expired' } }),
      db.childPanels.aggregate({
        _sum: { totalRevenue: true },
      }),
      db.childPanels.aggregate({
        _sum: { totalOrders: true },
      }),
      db.childPanels.aggregate({
        _sum: { apiCallsTotal: true },
      }),
      db.childPanels.aggregate({
        _sum: { apiCallsToday: true },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayApiCalls = await db.childPanels.findMany({
      where: {
        lastActivity: {
          gte: today,
        },
      },
      select: {
        apiCallsToday: true,
      },
    });

    const todayApiCallsTotal = todayApiCalls.reduce(
      (sum, panel) => sum + (panel.apiCallsToday || 0),
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalPanels,
        activePanels,
        inactivePanels,
        suspendedPanels,
        pendingPanels,
        expiredPanels,
        totalRevenue: totalRevenueResult._sum.totalRevenue || 0,
        totalOrders: totalOrdersResult._sum.totalOrders || 0,
        totalApiCalls: apiCallsResult._sum.apiCallsTotal || 0,
        todayApiCalls: todayApiCallsTotal,
      },
    });
  } catch (error) {
    console.error('Error fetching child panel stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch child panel statistics',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

