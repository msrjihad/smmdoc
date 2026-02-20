import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        dateFilter = {
          createdAt: {
            gte: todayStart
          }
        };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = {
          createdAt: {
            gte: weekAgo
          }
        };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = {
          createdAt: {
            gte: monthAgo
          }
        };
        break;
      default:
        break;
    }

    const [
      totalTransactions,
      pendingTransactions,
      completedTransactions,
      cancelledTransactions,
      totalVolumeResult,
      todayTransactions,
      recentTransactions
    ] = await Promise.all([
      db.addFunds.count({ where: dateFilter }),
      
      db.addFunds.count({ 
        where: { ...dateFilter, status: 'Processing' } 
      }),
      
      db.addFunds.count({ 
        where: { ...dateFilter, status: 'Success' } 
      }),
      
      db.addFunds.count({ 
        where: { ...dateFilter, status: 'Cancelled' } 
      }),
      
      db.addFunds.aggregate({
        where: { ...dateFilter, status: 'Success' },
        _sum: { amount: true }
      }),
      
      (() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return db.addFunds.count({
          where: {
            createdAt: {
              gte: todayStart
            }
          }
        });
      })(),
      
      db.addFunds.findMany({
        where: dateFilter,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    const totalVolume = totalVolumeResult._sum.amount 
      ? (typeof totalVolumeResult._sum.amount === 'object' && totalVolumeResult._sum.amount !== null
          ? Number(totalVolumeResult._sum.amount)
          : Number(totalVolumeResult._sum.amount))
      : 0;

    const statusBreakdown = {
      pending: pendingTransactions,
      completed: completedTransactions,
      cancelled: cancelledTransactions,
      Success: completedTransactions,
      Pending: pendingTransactions,
      Cancelled: cancelledTransactions
    };

    const percentages = {
      pending: totalTransactions > 0 ? Math.round((pendingTransactions / totalTransactions) * 100) : 0,
      completed: totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 0,
      cancelled: totalTransactions > 0 ? Math.round((cancelledTransactions / totalTransactions) * 100) : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        totalTransactions,
        pendingTransactions,
        completedTransactions,
        cancelledTransactions,
        totalVolume,
        todayTransactions,
        statusBreakdown,
        percentages,
        recentTransactions: recentTransactions.map(t => ({
          id: t.id,
          amount: typeof t.amount === 'object' && t.amount !== null 
            ? Number(t.amount) 
            : Number(t.amount || 0),
          status: t.status,
          createdAt: t.createdAt.toISOString(),
          user: t.user
        })),
        period
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch transaction stats: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null 
      },
      { status: 500 }
    );
  }
}
