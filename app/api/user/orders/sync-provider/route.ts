import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ApiRequestBuilder, ApiResponseParser, createApiSpecFromProvider } from '@/lib/provider-api-specification';
import { broadcastOrderUpdate } from '@/lib/utils/realtime-sync';

const MAX_SYNC_TIME_MS = 30000;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized access',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { syncAll = false } = body;

    let orders = [];

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

      console.log('Fetching all provider orders to sync with whereClause:', JSON.stringify(whereClause, null, 2));

      try {
        orders = await db.newOrders.findMany({
          where: whereClause,
          include: {
            service: {
              select: {
                id: true,
                name: true,
                providerServiceId: true,
                providerId: true
              }
            },
            user: {
              select: {
                id: true,
                currency: true,
                balance: true,
                total_spent: true,
                dollarRate: true
              }
            }
          },
          take: 200
        });

        console.log(`Found ${orders.length} provider orders to sync`);
      } catch (queryError) {
        console.error('Error querying orders to sync:', queryError);
        return NextResponse.json({
          success: false,
          message: 'Error querying orders for sync',
          error: queryError instanceof Error ? queryError.message : 'Unknown error',
          data: null
        }, { status: 500 });
      }
    } else {
      const userId = session.user.id;

      orders = await db.newOrders.findMany({
        where: {
          userId: userId,
          providerOrderId: {
            not: null
          },
          service: {
            providerId: {
              not: null
            }
          }
        },
        include: {
          service: {
            select: {
              id: true,
              providerId: true,
              providerServiceId: true
            }
          },
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
    }

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No provider orders to sync',
        data: {
          total: 0,
          processed: 0,
          synced: 0,
          results: []
        }
      });
    }

    const MAX_SYNC_TIME_MS = 25000;
    const MAX_ORDERS_TO_SYNC = 100;
    const startTime = Date.now();

    const limitedOrders = orders.slice(0, MAX_ORDERS_TO_SYNC);
    console.log(`Starting sync for ${limitedOrders.length} orders (limited from ${orders.length})`);

    const ordersByProvider = new Map<string, typeof orders>();

    for (const order of limitedOrders) {
      if (Date.now() - startTime > MAX_SYNC_TIME_MS) {
        console.log('Sync time limit reached, stopping early');
        break;
      }

      const orderProviderId = (order.service as any)?.providerId 
        ? (order.service as any).providerId.toString() 
        : null;
      
      if (orderProviderId) {
        if (!ordersByProvider.has(orderProviderId)) {
          ordersByProvider.set(orderProviderId, []);
        }
        ordersByProvider.get(orderProviderId)!.push(order);
      } else {
        console.log(`Order ${order.id} has no provider ID, skipping sync`);
      }
    }

    console.log(`Grouped ${limitedOrders.length} orders into ${ordersByProvider.size} provider(s)`);

    let totalProcessed = 0;
    let totalSynced = 0;
    const syncResults: any[] = [];

    broadcastOrderUpdate(0, {
      type: 'sync_start',
      total: limitedOrders.length,
      processed: 0,
      synced: 0
    });

    for (const [providerIdKey, providerOrders] of ordersByProvider) {
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
            status: true,
            timeout_seconds: true
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

        console.log(`Syncing ${providerOrders.length} orders for provider: ${provider.name} (ID: ${provider.id})`);

        for (const order of providerOrders) {
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
                      name: true,
                      email: true,
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
          } catch (error) {
            console.error(`Failed to sync order ${order.id}:`, error);
            totalProcessed++;
            syncResults.push({
              orderId: order.id,
              updated: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } catch (error) {
        console.error(`Error processing provider ${providerIdKey}:`, error);
      }
    }

    const elapsedTime = Date.now() - startTime;
    console.log(`Sync completed in ${elapsedTime}ms. Updated ${totalSynced} of ${limitedOrders.length} orders.`);

    return NextResponse.json({
      success: true,
      message: `Synced ${totalSynced} of ${totalProcessed} provider order(s)`,
      data: {
        total: orders.length,
        processed: totalProcessed,
        synced: totalSynced,
        totalChecked: orders.length,
        results: syncResults
      }
    });

  } catch (error) {
    console.error('Error in user provider sync:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during provider sync',
        success: false,
        data: null
      },
      { status: 500 }
    );
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
      timeout: ((provider as any).timeout_seconds || 30) * 1000
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

    const updateData: any = {
      providerStatus: mappedStatus,
      status: mappedStatus,
      apiResponse: JSON.stringify(responseData),
      lastSyncAt: new Date()
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

          const spentAdjustment = orderWithUser.status !== 'pending' ? orderPrice : 0;

          await db.$transaction(async (tx) => {
            await tx.users.update({
              where: { id: user.id },
              data: {
                balance: {
                  increment: orderPrice
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
        } else {
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
    throw error;
  }
}

function mapProviderStatus(providerStatus: string): string {
  if (!providerStatus) return 'pending';

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

  return statusMap[providerStatus?.toLowerCase()] || 'pending';
}

