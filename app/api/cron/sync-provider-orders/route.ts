import { db } from '@/lib/db';
import { updateAffiliateCommissionForOrder } from '@/lib/affiliate-commission-helper';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ApiRequestBuilder, ApiResponseParser, createApiSpecFromProvider } from '@/lib/provider-api-specification';

export async function GET(req: NextRequest) {
  try {
    console.log('Starting provider order sync...');

    const pendingOrders = await db.newOrders.findMany({
      where: {
        providerOrderId: { not: null },
        providerStatus: { in: ['pending', 'processing', 'in_progress'] }
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            providerServiceId: true
          }
        }
      },
      take: 50
    });

    console.log(`Found ${pendingOrders.length} pending provider orders to sync`);

    if (pendingOrders.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No pending provider orders to sync',
          data: { syncedCount: 0 }
        },
        { status: 200 }
      );
    }

    const ordersByProvider = new Map();
    
    for (const order of pendingOrders) {
      const providerId = await getProviderIdForOrder(order);
      
      if (providerId) {
        if (!ordersByProvider.has(providerId)) {
          ordersByProvider.set(providerId, []);
        }
        ordersByProvider.get(providerId).push(order);
      }
    }

    let totalSynced = 0;
    const syncResults = [];

    for (const [providerId, orders] of ordersByProvider) {
      try {
        const provider = await db.apiProviders.findUnique({
          where: { id: providerId },
          select: {
            id: true,
            name: true,
            api_url: true,
            api_key: true,
            status: true
          }
        });

        if (!provider || provider.status !== 'active') {
          console.log(`Skipping inactive provider: ${providerId}`);
          continue;
        }

        console.log(`Syncing ${orders.length} orders for provider: ${provider.name}`);

        for (const order of orders) {
          try {
            const syncResult = await syncSingleOrder(order, provider);
            if (syncResult.updated) {
              totalSynced++;
            }
            syncResults.push(syncResult);
          } catch (error) {
            console.error(`Failed to sync order ${order.id}:`, error);
            syncResults.push({
              orderId: order.id,
              updated: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

      } catch (error) {
        console.error(`Error syncing provider ${providerId}:`, error);
      }
    }

    console.log(`Provider sync completed. Updated ${totalSynced} orders.`);

    return NextResponse.json(
      {
        success: true,
        message: `Synced ${totalSynced} provider orders`,
        data: {
          syncedCount: totalSynced,
          totalChecked: pendingOrders.length,
          results: syncResults
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in provider order sync:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync provider orders',
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

    return lastLog?.providerId ? lastLog.providerId.toString() : null;
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
    const currentStatus = order.providerStatus;
    const isCancelled = mappedStatus === 'canceled' || mappedStatus === 'cancelled';
    const wasCancelled = currentStatus === 'canceled' || currentStatus === 'cancelled';
    const statusChangedToCancelled = isCancelled && !wasCancelled;

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

    const hasChanges = 
      mappedStatus !== currentStatus ||
      (parsedStatus.startCount !== undefined && parsedStatus.startCount !== order.startCount) ||
      (parsedStatus.remains !== undefined && parsedStatus.remains !== order.remains) ||
      (parsedStatus.charge !== undefined && parsedStatus.charge !== order.charge);

    if (hasChanges) {
      console.log(`Order data updated for order ${order.id}:`, {
        status: `${currentStatus} -> ${mappedStatus}`,
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

            if (statusChangedToCancelled) {
              await updateAffiliateCommissionForOrder(order.id, 'cancelled', tx);
            }
          });

          console.log(`Refund processed successfully for order ${order.id}. User ${user.id} received ${refundAmount} ${user.currency}`);
        } else {
          console.warn(`Could not find user for order ${order.id}, skipping refund`);
          await db.$transaction(async (tx) => {
            await tx.newOrders.update({
              where: { id: order.id },
              data: updateData
            });
            if (statusChangedToCancelled) {
              await updateAffiliateCommissionForOrder(order.id, 'cancelled', tx);
            }
          });
        }
      } else {
        await db.$transaction(async (tx) => {
          await tx.newOrders.update({
            where: { id: order.id },
            data: updateData
          });
          if (mappedStatus === 'completed' || mappedStatus === 'cancelled') {
            await updateAffiliateCommissionForOrder(order.id, mappedStatus, tx);
          }
        });
      }

      await db.providerOrderLogs.create({
        data: {
          orderId: order.id,
          providerId: provider.id,
          action: 'status_sync',
          status: 'success',
          response: JSON.stringify(responseData),
          createdAt: new Date()
        }
      });

      return {
        orderId: order.id,
        updated: true,
        oldStatus: currentStatus,
        newStatus: mappedStatus,
        data: {
          startCount: parsedStatus.startCount,
          remains: parsedStatus.remains,
          charge: parsedStatus.charge
        }
      };
    } else {
      await db.$transaction(async (tx) => {
        await tx.newOrders.update({
          where: { id: order.id },
          data: {
            lastSyncAt: new Date()
          }
        });
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
        action: 'status_sync',
        status: 'failed',
        response: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    });

    throw error;
  }
}

function mapProviderStatus(providerStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'pending',
    'in_progress': 'processing',
    'processing': 'processing',
    'completed': 'completed',
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required', data: null },
        { status: 400 }
      );
    }

    const order = await db.newOrders.findUnique({
      where: { id: orderId },
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

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found', data: null },
        { status: 404 }
      );
    }

    if (!order.providerOrderId) {
      return NextResponse.json(
        { success: false, message: 'Order is not a provider order', data: null },
        { status: 400 }
      );
    }

    const providerId = await getProviderIdForOrder(order);
    if (!providerId) {
      return NextResponse.json(
        { success: false, message: 'Provider not found for this order', data: null },
        { status: 404 }
      );
    }

    const provider = await db.apiProviders.findUnique({
      where: { id: parseInt(providerId) },
      select: {
        id: true,
        name: true,
        api_url: true,
        api_key: true,
        status: true
      }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Provider not found', data: null },
        { status: 404 }
      );
    }

    const syncResult = await syncSingleOrder(order, provider);

    return NextResponse.json(
      {
        success: true,
        message: 'Order synced successfully',
        data: syncResult
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in manual order sync:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync order',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
