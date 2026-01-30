import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { runProviderSync } from '@/lib/utils/provider-sync';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const orderId = searchParams.get('orderId');
    const providerId = searchParams.get('providerId');
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;
    
    const whereClause: any = {};
    
    if (orderId) {
      whereClause.orderId = orderId;
    }
    
    if (providerId) {
      whereClause.providerId = providerId;
    }
    
    if (action) {
      whereClause.action = action;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const [logs, totalCount] = await Promise.all([
      db.providerOrderLogs.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              link: true,
              qty: true,
              status: true,
              providerOrderId: true,
              providerStatus: true,
              lastSyncAt: true,
              createdAt: true,
              service: {
                select: {
                  id: true,
                  name: true
                }
              },
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            }
          },
          provider: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.providerOrderLogs.count({
        where: whereClause
      })
    ]);

    const stats = await db.providerOrderLogs.groupBy({
      by: ['status', 'action'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

      const providerOrderStats = await db.newOrders.groupBy({
      by: ['providerStatus'],
      _count: {
        id: true
      },
      where: {
        providerOrderId: {
          not: null
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          },
          stats: {
            last24Hours: stats,
            providerOrders: providerOrderStats
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching provider sync data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch provider sync data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderIds, syncAll = false, providerId } = body;

    if (!syncAll && (!orderIds || orderIds.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either provide orderIds or set syncAll to true',
          data: null
        },
        { status: 400 }
      );
    }

    console.log('Manual provider sync triggered by admin:', {
      adminId: session.user.id,
      orderIds,
      syncAll,
      providerId
    });

    const result = await runProviderSync({
      orderIds,
      syncAll,
      providerId,
      broadcast: true,
      action: 'manual_sync'
    });

    return NextResponse.json(
      {
        success: true,
        message: `Manually synced ${result.syncedCount} provider orders`,
        data: {
          syncedCount: result.syncedCount,
          totalProcessed: result.totalProcessed,
          totalChecked: result.totalChecked,
          results: result.results
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in manual provider sync:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to manually sync provider orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
