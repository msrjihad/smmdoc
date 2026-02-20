import { db } from '@/lib/db';
import { updateAffiliateCommissionForOrder } from '@/lib/affiliate-commission-helper';
import axios from 'axios';
import {
  ApiRequestBuilder,
  ApiResponseParser,
  createApiSpecFromProvider
} from '@/lib/provider-api-specification';
import { broadcastOrderUpdate, broadcastSyncProgress } from '@/lib/utils/realtime-sync';

const MAX_SYNC_TIME_MS = 25000;
const MAX_ORDERS_TO_SYNC = 100;

export type ProviderSyncOptions = {
  orderIds?: number[];
  syncAll?: boolean;
  providerId?: number | string;
  broadcast?: boolean;
  action?: 'manual_sync' | 'cron_sync';
};

export type ProviderSyncResult = {
  success: boolean;
  syncedCount: number;
  totalProcessed: number;
  totalChecked: number;
  results: Array<{
    orderId: number;
    updated: boolean;
    error?: string;
    oldStatus?: string;
    oldProviderStatus?: string;
    newStatus?: string;
    data?: { startCount?: number | bigint; remains?: number | bigint; charge?: number };
    status?: string;
    message?: string;
  }>;
};

export async function runProviderSync(
  options: ProviderSyncOptions
): Promise<ProviderSyncResult> {
  const {
    orderIds,
    syncAll = false,
    providerId,
    broadcast = false,
    action = 'manual_sync'
  } = options;

  const syncResults: ProviderSyncResult['results'] = [];
  let ordersToSync: Awaited<ReturnType<typeof fetchOrdersToSync>> = [];

  if (syncAll) {
    ordersToSync = await fetchOrdersForSyncAll(providerId);
  } else if (orderIds && orderIds.length > 0) {
    ordersToSync = await fetchOrdersByIds(orderIds);
  } else {
    return {
      success: true,
      syncedCount: 0,
      totalProcessed: 0,
      totalChecked: 0,
      results: []
    };
  }

  if (ordersToSync.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      totalProcessed: 0,
      totalChecked: 0,
      results: []
    };
  }

  const startTime = Date.now();
  const limitedOrders = ordersToSync.slice(0, MAX_ORDERS_TO_SYNC);

  console.log(
    `Starting provider sync for ${limitedOrders.length} orders (limited from ${ordersToSync.length}), action: ${action}`
  );

  const ordersByProvider = new Map<string, typeof limitedOrders>();

  for (const order of limitedOrders) {
    if (Date.now() - startTime > MAX_SYNC_TIME_MS) {
      console.log('Sync time limit reached, stopping early');
      break;
    }

    const orderProviderId =
      (order.service as { providerId?: number })?.providerId?.toString() ??
      (await getProviderIdForOrder(order));

    if (orderProviderId) {
      const existing = ordersByProvider.get(orderProviderId) ?? [];
      existing.push(order);
      ordersByProvider.set(orderProviderId, existing);
    } else {
      console.log(`Order ${order.id} has no provider ID, skipping sync`);
    }
  }

  console.log(
    `Grouped orders into ${ordersByProvider.size} provider(s)`
  );

  const providerIds = [...ordersByProvider.keys()].map((k) =>
    typeof k === 'string' ? parseInt(k, 10) : k
  );
  const providersList =
    providerIds.length > 0
      ? await db.apiProviders.findMany({
          where: { id: { in: providerIds } },
          select: {
            id: true,
            name: true,
            api_url: true,
            api_key: true,
            status: true,
            timeout_seconds: true
          }
        })
      : [];
  const providerMap = new Map(providersList.map((p) => [p.id, p]));

  let totalSynced = 0;
  let totalProcessed = 0;

  if (broadcast) {
    broadcastSyncProgress({
      total: limitedOrders.length,
      processed: 0,
      synced: 0
    });
  }

  for (const [providerIdKey, orders] of ordersByProvider) {
    if (Date.now() - startTime > MAX_SYNC_TIME_MS) {
      console.log('Sync time limit reached, stopping provider sync');
      break;
    }

    try {
      const providerIdInt =
        typeof providerIdKey === 'string' ? parseInt(providerIdKey, 10) : providerIdKey;
      const provider = providerMap.get(providerIdInt);

      if (!provider) {
        console.log(`Provider not found: ${providerIdKey}`);
        continue;
      }

      if (provider.status !== 'active') {
        console.log(
          `Skipping inactive provider: ${provider.name} (ID: ${provider.id})`
        );
        continue;
      }

      console.log(
        `Syncing ${orders.length} orders for provider: ${provider.name} (ID: ${provider.id})`
      );

      const updatedOrderIds: number[] = [];
      for (const order of orders) {
        if (Date.now() - startTime > MAX_SYNC_TIME_MS) {
          console.log('Sync time limit reached, stopping order sync');
          break;
        }

        try {
          totalProcessed++;
          const syncResult = await syncSingleOrder(order, provider, action);
          if (syncResult.updated) {
            totalSynced++;
            if (broadcast) updatedOrderIds.push(order.id);
          }
          syncResults.push(syncResult);

          if (broadcast) {
            broadcastSyncProgress({
              total: limitedOrders.length,
              processed: totalProcessed,
              synced: totalSynced,
              currentOrderId: order.id
            });
          }
        } catch (error) {
          console.error(`Failed to sync order ${order.id}:`, error);
          totalProcessed++;
          syncResults.push({
            orderId: order.id,
            updated: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          if (broadcast) {
            broadcastSyncProgress({
              total: limitedOrders.length,
              processed: totalProcessed,
              synced: totalSynced,
              currentOrderId: order.id
            });
          }
        }
      }

      if (broadcast && updatedOrderIds.length > 0) {
        const updatedOrders = await db.newOrders.findMany({
          where: { id: { in: updatedOrderIds } },
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
        for (const updatedOrder of updatedOrders) {
          broadcastOrderUpdate(updatedOrder.id, {
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
    } catch (error) {
      console.error(`Error syncing provider ${providerIdKey}:`, error);
    }
  }

  const elapsedTime = Date.now() - startTime;
  console.log(
    `Provider sync completed in ${elapsedTime}ms. Updated ${totalSynced} of ${limitedOrders.length} orders.`
  );

  return {
    success: true,
    syncedCount: totalSynced,
    totalProcessed: limitedOrders.length,
    totalChecked: ordersToSync.length,
    results: syncResults
  };
}

type OrderWithService = Awaited<ReturnType<typeof db.newOrders.findMany>>[number] & {
  service: {
    id: number;
    name: string;
    providerServiceId: string | null;
    providerId?: number | null;
  };
};

async function fetchOrdersToSync(
  where: any,
  includeProviderId = false
) {
  return db.newOrders.findMany({
    where,
    include: {
      service: {
        select: {
          id: true,
          name: true,
          providerServiceId: true,
          ...(includeProviderId && { providerId: true })
        }
      }
    },
    take: 200
  }) as Promise<OrderWithService[]>;
}

async function fetchOrdersForSyncAll(providerId?: number | string) {
  const whereClause = {
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
    (whereClause.AND as object[]).push({
      service: { providerId: typeof providerId === 'string' ? parseInt(providerId, 10) : providerId }
    });
  }

  return fetchOrdersToSync(whereClause, true);
}

async function fetchOrdersByIds(orderIds: number[]) {
  return fetchOrdersToSync({
    id: { in: orderIds },
    providerOrderId: { not: null }
  });
}

async function getProviderIdForOrder(order: { id: number; serviceId: number }): Promise<string | null> {
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

    return lastLog?.providerId?.toString() ?? null;
  } catch (error) {
    console.error(`Error getting provider for order ${order.id}:`, error);
    return null;
  }
}

async function syncSingleOrder(
  order: OrderWithService,
  provider: {
    id: number;
    name: string;
    api_url: string;
    api_key: string;
    status: string;
    timeout_seconds?: number | null;
  },
  action: 'manual_sync' | 'cron_sync'
) {
  try {
    const apiSpec = createApiSpecFromProvider(provider);

    const apiBuilder = new ApiRequestBuilder(
      apiSpec,
      provider.api_url,
      provider.api_key,
      (provider as { http_method?: string; httpMethod?: string }).http_method ??
        (provider as { http_method?: string; httpMethod?: string }).httpMethod ??
        'POST'
    );

    const statusRequest = apiBuilder.buildOrderStatusRequest(order.providerOrderId!);

    console.log(
      `Checking status for order ${order.id} (provider order: ${order.providerOrderId})`
    );

    const response = await axios({
      method: statusRequest.method,
      url: statusRequest.url,
      data: statusRequest.data,
      headers: statusRequest.headers,
      timeout: (provider.timeout_seconds ?? 30) * 1000
    });

    const responseData = response.data;

    if (!responseData) {
      throw new Error('Empty response from provider');
    }

    const responseParser = new ApiResponseParser(apiSpec);
    const parsedStatus = responseParser.parseOrderStatusResponse(responseData);
    const mappedStatus = mapProviderStatus(parsedStatus.status);
    const currentProviderStatus = order.providerStatus ?? order.status;
    const currentStatus = order.status;
    const isCancelled =
      mappedStatus === 'cancelled' || mappedStatus === 'canceled';
    const wasCancelled =
      currentProviderStatus === 'cancelled' ||
      currentProviderStatus === 'canceled' ||
      currentStatus === 'cancelled' ||
      currentStatus === 'canceled';
    const statusChangedToCancelled = isCancelled && !wasCancelled;

    const updateData: Record<string, unknown> = {
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
      mappedStatus !== currentProviderStatus || mappedStatus !== currentStatus;
    const hasChanges =
      statusChanged ||
      (parsedStatus.startCount !== undefined &&
        parsedStatus.startCount !== order.startCount) ||
      (parsedStatus.remains !== undefined &&
        parsedStatus.remains !== order.remains) ||
      (parsedStatus.charge !== undefined &&
        parsedStatus.charge !== order.charge);

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

        if (orderWithUser?.user) {
          const user = orderWithUser.user;
          const orderPrice =
            user.currency === 'USD'
              ? orderWithUser.usdPrice
              : orderWithUser.usdPrice * (user.dollarRate ?? 121.52);

          const refundAmount = orderPrice;
          const wasProcessed = orderWithUser.status !== 'pending';
          const spentAdjustment = wasProcessed
            ? Math.min(orderPrice, refundAmount)
            : 0;

          await db.$transaction(async (tx) => {
            await tx.users.update({
              where: { id: user.id },
              data: {
                balance: { increment: refundAmount },
                ...(spentAdjustment > 0 && {
                  total_spent: { decrement: spentAdjustment }
                })
              }
            });

            await tx.newOrders.update({
              where: { id: order.id },
              data: updateData
            });

            await updateAffiliateCommissionForOrder(order.id, 'cancelled', tx);
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

        if (mappedStatus === 'completed') {
          await db.$transaction(async (tx) => {
            await updateAffiliateCommissionForOrder(order.id, 'completed', tx);
          });
        }
      }

      await db.providerOrderLogs.create({
        data: {
          orderId: order.id,
          providerId: provider.id,
          action,
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
    }

    await db.newOrders.update({
      where: { id: order.id },
      data: { lastSyncAt: new Date() }
    });

    return {
      orderId: order.id,
      updated: false,
      status: currentStatus,
      message: 'Data unchanged'
    };
  } catch (error) {
    console.error(`Error syncing order ${order.id}:`, error);

    await db.providerOrderLogs.create({
      data: {
        orderId: order.id,
        providerId: provider.id,
        action,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        response: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        createdAt: new Date()
      }
    });

    throw error;
  }
}

function mapProviderStatus(providerStatus: string): string {
  if (!providerStatus) return 'pending';

  const normalizedStatus = providerStatus
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

  const statusMap: Record<string, string> = {
    pending: 'pending',
    in_progress: 'processing',
    inprogress: 'processing',
    processing: 'processing',
    completed: 'completed',
    complete: 'completed',
    partial: 'partial',
    canceled: 'cancelled',
    cancelled: 'cancelled',
    refunded: 'refunded',
    failed: 'failed',
    fail: 'failed',
    error: 'failed'
  };

  if (statusMap[normalizedStatus]) {
    return statusMap[normalizedStatus];
  }

  const originalLower = providerStatus.toLowerCase().trim();
  if (statusMap[originalLower]) {
    return statusMap[originalLower];
  }

  console.warn(
    `Unknown provider status: "${providerStatus}", defaulting to pending`
  );
  return 'pending';
}
