import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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

    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      declinedRequests,
      completedRequests
    ] = await Promise.all([
      db.refillRequests.count(),
      
      db.refillRequests.count({
        where: { status: 'pending' }
      }),
      
      db.refillRequests.count({
        where: { status: 'approved' }
      }),
      
      db.refillRequests.count({
        where: { status: 'declined' }
      }),
      
      db.refillRequests.count({
        where: { status: 'completed' }
      })
    ]);

    const [eligibleOrdersCount, partialOrdersCount, completedOrdersCount] = await Promise.all([
      db.newOrders.count({
        where: {
          status: {
            in: ['completed', 'partial']
          },
          service: {
            refill: true
          }
        }
      }),
      db.newOrders.count({
        where: {
          status: 'partial',
          service: {
            refill: true
          }
        }
      }),
      db.newOrders.count({
        where: {
          status: 'completed',
          service: {
            refill: true
          }
        }
      })
    ]);

    const stats = {
      totalRequests,
      pendingRequests,
      approvedRequests,
      declinedRequests,
      completedRequests,
      eligibleOrdersCount,
      partialOrdersCount,
      completedOrdersCount
    };

    return NextResponse.json({
      success: true,
      data: stats,
      error: null
    });

  } catch (error) {
    console.error('Error fetching refill request stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch refill request statistics',
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
