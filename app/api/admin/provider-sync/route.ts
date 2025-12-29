import { auth } from '@/auth';
import { db } from '@/lib/db';
import { updateAffiliateCommissionForOrder } from '@/lib/affiliate-commission-helper';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ApiRequestBuilder, ApiResponseParser, createApiSpecFromProvider } from '@/lib/provider-api-specification';
import { broadcastOrderUpdate, broadcastSyncProgress } from '@/lib/utils/realtime-sync';

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

    console.log('Manual provider sync triggered by admin:', {
      adminId: session.user.id,
      orderIds,
      syncAll,
      providerId
    });

    let ordersToSync = [];

    if (syncAll) {
      const whereClause: any = {
        AND: [
          { providerOrderId: { not: null } },
          {
            service: {
              providerId: { not: null },
              providerServiceId: { not: null }
            }
          }
        ]
      };
      

      if (providerId) {
        whereClause.AND.push({
          service: {
            providerId: parseInt(providerId)
          }
        });
      }

      console.log('Fetching orders to sync with whereClause:', JSON.stringify(whereClause, null, 2));

      try {
        ordersToSync = await db.newOrders.findMany({
          where: whereClause,
          include: {
            service: {
              select: {
                id: true,
                name: true,
                providerServiceId: true,
                providerId: true
              }
            }
          },
          take: 200
        });

        console.log(`Found ${ordersToSync.length} orders to sync`);
      } catch (queryError) {
        console.error('Error querying orders to sync:', queryError);
        return NextResponse.json({
          success: false,
          message: 'Error querying orders for sync',
          error: queryError instanceof Error ? queryError.message : 'Unknown error',
          data: null
        }, { status: 500 });
      }
    } else if (orderIds && orderIds.length > 0) {
      ordersToSync = await db.newOrders.findMany({
        where: {
          id: { in: orderIds },
          providerOrderId: { not: null }
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              providerServiceId: true
            }
          }
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Either provide orderIds or set syncAll to true',
          data: null
        },
        { status: 400 }
      );
    }

    if (ordersToSync.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No orders found to sync',
          data: { syncedCount: 0 }
        },
        { status: 200 }
      );
    }

    const MAX_SYNC_TIME_MS = 25000;
    const MAX_ORDERS_TO_SYNC = 100;
    const startTime = Date.now();

    const limitedOrders = ordersToSync.slice(0, MAX_ORDERS_TO_SYNC);
    console.log(`Starting manual sync for ${limitedOrders.length} orders (limited from ${ordersToSync.length})`);

    const ordersByProvider = new Map();
    
    for (const order of limitedOrders) {
      if (Date.now() - startTime > MAX_SYNC_TIME_MS) {
        console.log('Sync time limit reached, stopping early');
        break;
      }

      const orderProviderId = (order.service as any)?.providerId 
        ? (order.service as any).providerId.toString() 
        : await getProviderIdForOrder(order);
      
      if (orderProviderId) {
        if (!ordersByProvider.has(orderProviderId)) {
          ordersByProvider.set(orderProviderId, []);
        }
        ordersByProvider.get(orderProviderId).push(order);
      } else {
        console.log(`Order ${order.id} has no provider ID, skipping sync`);
      }
    }

    console.log(`Grouped ${limitedOrders.length} orders into ${ordersByProvider.size} provider(s)`);

    let totalSynced = 0;
    const syncResults = [];
    let totalProcessed = 0;

    broadcastSyncProgress({
      total: limitedOrders.length,
      processed: 0,
      synced: 0
    });

    for (const [providerIdKey, orders] of ordersByProvider) {
      if (Date.now() - startTime > MAX_SYNC_TIME_MS) {
        console.log('Sync time limit reached, stopping provider sync');
        break;
      }

      try {
        const providerIdInt = typeof providerIdKey === 'string' ? parseInt(providerIdKey) : providerIdKey;
        const provider = await db.apiProviders.findUnique({
          where: { id: providerIdInt },
          select: {
            id: true,
            name: true,
            api_url: true,
            api_key: true,
            status: true
          }
        });

        if (!provider) {
          console.log(`Provider not found: ${providerIdKey}`);
          continue;
        }

        if (provider.status !== 'active') {
          console.log(`Skipping inactive provider: ${provider.name} (ID: ${provider.id})`);
          continue;
        }

        console.log(`Syncing ${orders.length} orders for provider: ${provider.name} (ID: ${provider.id})`);

        for (const order of orders) {
          if (Date.now() - startTime > MAX_SYNC_TIME_MS) {
            console.log('Sync time limit reached, stopping order sync');
            break;
          }

          try {
            totalProcessed++;
            const syncResult = await syncSingleOrder(order, provider);
            if (syncResult.updated) {
              totalSynced++;
              
              const updatedOrder = await db.newOrders.findUnique({
                where: { id: order.id },
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      name: true,
                      username: true,
                      currency: true
                    }
                  },
                  service: {
                    select: {
                      id: true,
                      name: true,
                      rate: true,
                      min_order: true,
                      max_order: true,
                      providerId: true,
                      providerName: true,
                      providerServiceId: true
                    }
                  },
                  category: {
                    select: {
                      id: true,
                      category_name: true
                    }
                  }
                }
              });

              if (updatedOrder) {
                broadcastOrderUpdate(order.id, {
                  id: updatedOrder.id,
                  status: updatedOrder.status,
                  providerStatus: updatedOrder.providerStatus,
                  startCount: updatedOrder.startCount,
                  remains: updatedOrder.remains,
                  charge: updatedOrder.charge,
                  lastSyncAt: updatedOrder.lastSyncAt,
                  user: updatedOrder.user,
                  service: updatedOrder.service,
                  category: updatedOrder.category
                });
              }
            }
            syncResults.push(syncResult);

            broadcastSyncProgress({
              total: limitedOrders.length,
              processed: totalProcessed,
              synced: totalSynced,
              currentOrderId: order.id
            });
          } catch (error) {
            console.error(`Failed to sync order ${order.id}:`, error);
            totalProcessed++;
            syncResults.push({
              orderId: order.id,
              updated: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });

            broadcastSyncProgress({
              total: limitedOrders.length,
              processed: totalProcessed,
              synced: totalSynced,
              currentOrderId: order.id
            });
          }
        }

      } catch (error) {
        console.error(`Error syncing provider ${providerIdKey}:`, error);
      }
    }

    const elapsedTime = Date.now() - startTime;
    console.log(`Manual sync completed in ${elapsedTime}ms. Updated ${totalSynced} of ${limitedOrders.length} orders.`);

    return NextResponse.json(
      {
        success: true,
        message: `Manually synced ${totalSynced} provider orders`,
        data: {
          syncedCount: totalSynced,
          totalProcessed: limitedOrders.length,
          totalChecked: ordersToSync.length,
          results: syncResults
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

async function getProviderIdForOrder(order: any): Promise<string | null> {
  try {
    const service = await db.services.findUnique({
      where: { id: order.serviceId },
      select: { providerId: true }
    });

    if (service?.providerId) {
      return service.providerId.toString();
    }

    const lastLog = await db.providerOrderLogs.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
      select: { providerId: true }
    });

    return lastLog?.providerId?.toString() || null;
  } catch (error) {
    console.error(`Error getting provider for order ${order.id}:`, error);
    return null;
  }
}

async function syncSingleOrder(order: any, provider: any) {
  try {
    const apiSpec = createApiSpecFromProvider(provider);
    
    const apiBuilder = new ApiRequestBuilder(
      apiSpec,
      provider.api_url,
      provider.api_key,
      (provider as any).http_method || (provider as any).httpMethod || 'POST'
    );

    const statusRequest = apiBuilder.buildOrderStatusRequest(order.providerOrderId);

    console.log(`Checking status for order ${order.id} (provider order: ${order.providerOrderId})`);

    const response = await axios({
      method: statusRequest.method,
      url: statusRequest.url,
      data: statusRequest.data,
      headers: statusRequest.headers,
      timeout: (provider.timeout_seconds || 30) * 1000
    });

    const responseData = response.data;

    if (!responseData) {
      throw new Error('Empty response from provider');
    }

    const responseParser = new ApiResponseParser(apiSpec);
    
    const parsedStatus = responseParser.parseOrderStatusResponse(responseData);
    
    const mappedStatus = mapProviderStatus(parsedStatus.status);
    const currentProviderStatus = order.providerStatus || order.status;
    const currentStatus = order.status;
    const isCancelled = mappedStatus === 'cancelled' || mappedStatus === 'canceled';
    const wasCancelled = currentProviderStatus === 'cancelled' || currentProviderStatus === 'canceled' || currentStatus === 'cancelled' || currentStatus === 'canceled';
    const statusChangedToCancelled = isCancelled && !wasCancelled;

    console.log(`Order ${order.id} status comparison:`, {
      providerStatus: parsedStatus.status,
      mappedStatus,
      currentProviderStatus,
      currentStatus,
      orderProviderStatus: order.providerStatus,
      orderStatus: order.status,
      isCancelled,
      wasCancelled,
      statusChangedToCancelled
    });

    const updateData: any = {
      providerStatus: mappedStatus,
      status: mappedStatus,
      apiResponse: JSON.stringify(responseData),
      lastSyncAt: new Date(),
    };

    if (parsedStatus.startCount !== undefined && parsedStatus.startCount !== null) {
      updateData.startCount = parsedStatus.startCount;
    }
    
    if (parsedStatus.remains !== undefined && parsedStatus.remains !== null) {
      updateData.remains = parsedStatus.remains;
    }

    if (parsedStatus.charge !== undefined && parsedStatus.charge !== null) {
      updateData.charge = parsedStatus.charge;
    }

    const statusChanged = 
      mappedStatus !== currentProviderStatus ||
      mappedStatus !== currentStatus;

    const hasChanges = 
      statusChanged ||
      (parsedStatus.startCount !== undefined && parsedStatus.startCount !== order.startCount) ||
      (parsedStatus.remains !== undefined && parsedStatus.remains !== order.remains) ||
      (parsedStatus.charge !== undefined && parsedStatus.charge !== order.charge);

    if (hasChanges) {
      console.log(`Order data updated for order ${order.id}:`, {
        oldProviderStatus: currentProviderStatus,
        oldStatus: currentStatus,
        newStatus: mappedStatus,
        startCount: parsedStatus.startCount,
        remains: parsedStatus.remains,
        charge: parsedStatus.charge,
        statusChangedToCancelled
      });

      if (statusChangedToCancelled) {
        const orderWithUser = await db.newOrders.findUnique({
          where: { id: order.id },
          include: {
            user: {
              select: {
                id: true,
                currency: true,
                balance: true,
                total_spent: true,
                dollarRate: true
              }
            }
          }
        });

        if (orderWithUser && orderWithUser.user) {
          const user = orderWithUser.user;
          const orderPrice = user.currency === 'USD' 
            ? orderWithUser.usdPrice 
            : orderWithUser.usdPrice * (user.dollarRate || 121.52);
          
          const refundAmount = orderPrice;
          const wasProcessed = orderWithUser.status !== 'pending';
          const spentAdjustment = wasProcessed ? Math.min(orderPrice, refundAmount) : 0;

          console.log(`Processing refund for cancelled order ${order.id}:`, {
            userId: user.id,
            orderPrice,
            refundAmount,
            wasProcessed,
            spentAdjustment,
            previousBalance: user.balance
          });

          await db.$transaction(async (tx) => {
            await tx.users.update({
              where: { id: user.id },
              data: {
                balance: {
                  increment: refundAmount
                },
                ...(spentAdjustment > 0 && {
                  total_spent: {
                    decrement: spentAdjustment
                  }
                })
              }
            });

            await tx.newOrders.update({
              where: { id: order.id },
              data: updateData
            });
          });

          console.log(`Refund processed successfully for order ${order.id}. User ${user.id} received ${refundAmount} ${user.currency}`);
        } else {
          console.warn(`Could not find user for order ${order.id}, skipping refund`);
          await db.newOrders.update({
            where: { id: order.id },
            data: updateData
          });
        }
      } else {
        await db.newOrders.update({
          where: { id: order.id },
          data: updateData
        });
      }

      await db.providerOrderLogs.create({
        data: {
          orderId: order.id,
          providerId: provider.id,
          action: 'manual_sync',
          status: 'success',
          response: JSON.stringify(responseData),
          createdAt: new Date()
        }
      });

      return {
        orderId: order.id,
        updated: true,
        oldStatus: currentStatus,
        oldProviderStatus: currentProviderStatus,
        newStatus: mappedStatus,
        data: {
          startCount: parsedStatus.startCount,
          remains: parsedStatus.remains,
          charge: parsedStatus.charge
        }
      };
    } else {
      await db.newOrders.update({
        where: { id: order.id },
        data: {
          lastSyncAt: new Date()
        }
      });

      return {
        orderId: order.id,
        updated: false,
        status: currentStatus,
        message: 'Data unchanged'
      };
    }

  } catch (error) {
    console.error(`Error syncing order ${order.id}:`, error);

    await db.providerOrderLogs.create({
      data: {
        orderId: order.id,
        providerId: provider.id,
        action: 'manual_sync',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        response: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        createdAt: new Date()
      }
    });

    throw error;
  }
}

function mapProviderStatus(providerStatus: string): string {
  if (!providerStatus) return 'pending';
  
  const normalizedStatus = providerStatus.toLowerCase().trim().replace(/\s+/g, '_');
  
  const statusMap: { [key: string]: string } = {
    'pending': 'pending',
    'in_progress': 'processing',
    'inprogress': 'processing',
    'processing': 'processing',
    'completed': 'completed',
    'complete': 'completed',
    'partial': 'partial',
    'canceled': 'cancelled',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
    'failed': 'failed',
    'fail': 'failed',
    'error': 'failed'
  };

  if (statusMap[normalizedStatus]) {
    return statusMap[normalizedStatus];
  }

  const originalLower = providerStatus.toLowerCase().trim();
  if (statusMap[originalLower]) {
    return statusMap[originalLower];
  }

  console.warn(`Unknown provider status: "${providerStatus}", defaulting to pending`);
  return 'pending';
}
