import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateOrderByType, getServiceTypeConfig } from '@/lib/service-types';
import { ProviderOrderForwarder } from '@/lib/utils/provider-order-forwarder';
import { convertFromUSD, fetchCurrencyData } from '@/lib/currency-utils';

const KEY_PARAM = 'key';
const ACTION_PARAM = 'action';

type Params = Record<string, string>;

async function getUserByApiKey(key: string) {
  if (!key || key.trim() === '') return null;
  return db.users.findFirst({
    where: { apiKey: key.trim() },
    select: {
      id: true,
      balance: true,
      currency: true,
      dollarRate: true,
      total_spent: true,
    },
  });
}

async function parseBody(req: NextRequest): Promise<Params> {
  if (req.method === 'GET') return {};
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      return typeof body === 'object' && body !== null
        ? Object.fromEntries(
            Object.entries(body).map(([k, v]) => [k, v != null ? String(v) : ''])
          )
        : {};
    }
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const out: Params = {};
      form.forEach((v, k) => {
        out[k] = typeof v === 'string' ? v : (v as File).name || '';
      });
      return out;
    }
  } catch {
    return {};
  }
  return {};
}

async function getParams(req: NextRequest): Promise<Params> {
  const query = Object.fromEntries(new URL(req.url).searchParams);
  const body = await parseBody(req);
  return { ...query, ...body };
}

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(req: NextRequest) {
  try {
    const params = await getParams(req);
    const key = params[KEY_PARAM] || params.key || '';
    const action = (params[ACTION_PARAM] || params.action || '').toLowerCase();

    const user = await getUserByApiKey(key);
    if (!user) {
      return apiError('Invalid API key', 401);
    }

    switch (action) {
      case 'services':
        return handleServices(params);
      case 'add':
        return handleAddOrder(req, params, user);
      case 'status':
        return handleOrderStatus(params, user);
      case 'refill':
        return handleRefill(params, user);
      case 'refill_status':
        return handleRefillStatus(params, user);
      case 'cancel':
        return handleCancel(params, user);
      case 'balance':
        return handleBalance(user);
      default:
        return apiError(`Unknown action: ${action || '(empty)'}`, 400);
    }
  } catch (error) {
    console.error('API route error:', error);
    return apiError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

async function handleServices(_params: Params) {
  const MAX_SERVICES_API = 5000;
  const services = await db.services.findMany({
    where: {
      status: 'active',
      category: { hideCategory: 'no' },
    },
    select: {
      id: true,
      name: true,
      rate: true,
      min_order: true,
      max_order: true,
      refill: true,
      cancel: true,
      packageType: true,
      category: { select: { category_name: true } },
    },
    orderBy: { id: 'asc' },
    take: MAX_SERVICES_API,
  });

  const { servicePackageType } = await import('@/lib/service-types');
  const list = services.map((s) => ({
    service: s.id,
    name: s.name,
    type: servicePackageType(s.packageType || 1),
    category: s.category?.category_name || '',
    rate: (s.rate || 0).toFixed(2),
    min: String(s.min_order || 0),
    max: String(s.max_order || 0),
    refill: s.refill ? '1' : '0',
    cancel: s.cancel ? '1' : '0',
  }));

  return NextResponse.json(list);
}

async function handleAddOrder(req: NextRequest, params: Params, user: { id: number; balance: number; currency: string; dollarRate: number | null }) {
  const serviceId = parseInt(params.service || params.serviceId || '0');
  const link = params.link || '';
  const quantity = parseInt(params.quantity || params.qty || '0');
  const runs = params.runs ? parseInt(params.runs) : undefined;
  const interval = params.interval ? parseInt(params.interval) : undefined;
  const comments = params.comments || params.keywords || undefined;

  if (!serviceId || !link) {
    return apiError('Missing required fields: service, link');
  }

  const service = await db.services.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      name: true,
      rate: true,
      min_order: true,
      max_order: true,
      avg_time: true,
      status: true,
      categoryId: true,
      providerId: true,
      providerServiceId: true,
      packageType: true,
    },
  });

  if (!service || service.status !== 'active') {
    return apiError(`Service not found or inactive: ${serviceId}`);
  }

  const qty = quantity > 0 ? quantity : Number(service.min_order);
  if (qty < Number(service.min_order) || qty > Number(service.max_order)) {
    return apiError(
      `Quantity must be between ${service.min_order} and ${service.max_order}`
    );
  }

  const packageType = service.packageType || 1;
  const typeConfig = getServiceTypeConfig(packageType);
  const validation = typeConfig
    ? validateOrderByType(packageType, {
        link,
        qty,
        comments,
        username: undefined,
        posts: undefined,
        delay: undefined,
        minQty: undefined,
        maxQty: undefined,
        isDripfeed: !!(runs || interval),
        dripfeedRuns: runs,
        dripfeedInterval: interval,
        isSubscription: false,
      })
    : null;

  if (validation && Object.keys(validation).length > 0) {
    return apiError(
      `Validation failed: ${Object.values(validation).join(', ')}`
    );
  }

  let currencies: any[] = [];
  try {
    const { currencies: c } = await fetchCurrencyData();
    currencies = c || [];
  } catch {
    currencies = [{ code: 'USD', rate: 1 }, { code: 'USDT', rate: 1 }];
  }

  const calculatedUsdPrice = (service.rate * qty) / 1000;
  const userCurrency = user.currency || 'USD';
  const finalPrice =
    userCurrency === 'USD' || userCurrency === 'USDT'
      ? calculatedUsdPrice
      : convertFromUSD(calculatedUsdPrice, userCurrency, currencies);

  if (user.balance < finalPrice) {
    return apiError(
      `Insufficient balance. Required: ${finalPrice.toFixed(2)} ${userCurrency}`
    );
  }

  const orderData = {
    categoryId: service.categoryId,
    serviceId: service.id,
    userId: user.id,
    link,
    qty: BigInt(qty),
    price: finalPrice,
    usdPrice: calculatedUsdPrice,
    currency: userCurrency,
    avg_time: service.avg_time || 'N/A',
    status: 'pending' as const,
    remains: BigInt(qty),
    startCount: BigInt(0),
    packageType,
    comments: comments || null,
    dripfeedRuns: runs || null,
    dripfeedInterval: interval || null,
  };

  let providerOrderId: string | null = null;
  let providerStatus = 'pending';

  if (service.providerId) {
    try {
      const provider = await db.apiProviders.findUnique({
        where: { id: service.providerId },
      });
      if (provider && provider.status === 'active') {
        const providerForApi: any = {
          id: provider.id,
          name: provider.name,
          api_url: provider.api_url,
          api_key: provider.api_key,
          status: provider.status,
          api_type: (provider as any).api_type || 1,
          timeout_seconds: (provider as any).timeout_seconds || 30,
        };
        const forwarder = ProviderOrderForwarder.getInstance();
        const finalProviderServiceId =
          service.providerServiceId || String(service.id);
        const providerRes = await forwarder.forwardOrderToProvider(
          providerForApi,
          {
            service: finalProviderServiceId,
            link,
            quantity: qty,
            comments,
            packageType,
            runs,
            interval,
          }
        );
        if (providerRes?.order) {
          providerOrderId = String(providerRes.order);
          providerStatus = providerRes.status || 'In progress';
        }
      }
    } catch (err) {
      console.error('Provider forward error:', err);
    }
  }

  const order = await db.newOrders.create({
    data: {
      ...orderData,
      providerOrderId,
      providerStatus,
    },
  });

  await db.users.update({
    where: { id: user.id },
    data: {
      balance: { decrement: finalPrice },
      total_spent: { increment: finalPrice },
    },
  });

  return NextResponse.json({ order: order.id });
}

async function handleOrderStatus(
  params: Params,
  user: { id: number }
) {
  const orderParam = params.order || params.orderId;
  const ordersParam = params.orders;

  const ids: number[] = [];
  if (ordersParam) {
    ids.push(
      ...ordersParam
        .split(',')
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n))
    );
  } else if (orderParam) {
    const n = parseInt(String(orderParam));
    if (!isNaN(n)) ids.push(n);
  }

  if (ids.length === 0) {
    return apiError('Missing order or orders parameter');
  }

  const orders = await db.newOrders.findMany({
    where: {
      id: { in: ids.slice(0, 100) },
      userId: user.id,
    },
    select: {
      id: true,
      charge: true,
      startCount: true,
      status: true,
      remains: true,
      currency: true,
    },
  });

  const byId: Record<string, any> = {};
  for (const o of orders) {
    byId[String(o.id)] = {
      charge: String(o.charge ?? 0),
      start_count: String(o.startCount ?? 0),
      status: o.status || 'Pending',
      remains: String(o.remains ?? 0),
      currency: o.currency || 'USD',
    };
  }

  for (const id of ids) {
    if (!byId[String(id)]) {
      byId[String(id)] = { error: 'Incorrect order ID' };
    }
  }

  if (ids.length === 1 && ids[0] in byId && !('error' in byId[String(ids[0])])) {
    return NextResponse.json(byId[String(ids[0])]);
  }
  return NextResponse.json(byId);
}

async function handleRefill(params: Params, user: { id: number }) {
  const orderParam = params.order || params.orderId;
  const ordersParam = params.orders;
  const reason = params.reason || 'API refill request';

  const ids: number[] = [];
  if (ordersParam) {
    ids.push(
      ...ordersParam
        .split(',')
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n))
    );
  } else if (orderParam) {
    const n = parseInt(String(orderParam));
    if (!isNaN(n)) ids.push(n);
  }

  if (ids.length === 0) {
    return apiError('Missing order or orders parameter');
  }

  const limitedIds = ids.slice(0, 100);

  const [orders, existingRefills] = await Promise.all([
    db.newOrders.findMany({
      where: { id: { in: limitedIds } },
      select: {
        id: true,
        userId: true,
        status: true,
        service: { select: { refill: true, refillDays: true } },
      },
    }),
    db.refillRequests.findMany({
      where: {
        orderId: { in: limitedIds },
        status: { in: ['pending', 'approved'] },
      },
      select: { orderId: true },
    }),
  ]);

  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const existingOrderIds = new Set(existingRefills.map((r) => r.orderId));

  const results: Array<{ order: number; refill?: number; error?: string }> = [];

  for (const orderId of limitedIds) {
    const order = orderMap.get(orderId);

    if (!order || order.userId !== user.id) {
      results.push({ order: orderId, error: 'Incorrect order ID' });
      continue;
    }
    if (order.status !== 'completed') {
      results.push({ order: orderId, error: 'Order not eligible for refill' });
      continue;
    }
    if (!order.service?.refill) {
      results.push({ order: orderId, error: 'Service does not support refill' });
      continue;
    }
    if (existingOrderIds.has(orderId)) {
      results.push({ order: orderId, error: 'Refill already requested' });
      continue;
    }

    const refill = await db.refillRequests.create({
      data: { orderId, userId: user.id, reason, status: 'pending' },
    });
    results.push({ order: orderId, refill: refill.id });
  }

  if (results.length === 1) {
    const r = results[0];
    if (r.refill !== undefined) return NextResponse.json({ refill: r.refill });
    return NextResponse.json({ error: r.error });
  }
  return NextResponse.json(results);
}

async function handleRefillStatus(
  params: Params,
  user: { id: number }
) {
  const refillParam = params.refill || params.refillId;
  const refillsParam = params.refills;

  const ids: number[] = [];
  if (refillsParam) {
    ids.push(
      ...refillsParam
        .split(',')
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n))
    );
  } else if (refillParam) {
    const n = parseInt(String(refillParam));
    if (!isNaN(n)) ids.push(n);
  }

  if (ids.length === 0) {
    return apiError('Missing refill or refills parameter');
  }

  const refills = await db.refillRequests.findMany({
    where: {
      id: { in: ids.slice(0, 100) },
      userId: user.id,
    },
    select: { id: true, status: true },
  });

  const byId: Record<string, any> = {};
  for (const r of refills) {
    byId[String(r.id)] = { status: r.status || 'Pending' };
  }
  for (const id of ids) {
    if (!byId[String(id)]) {
      byId[String(id)] = { error: 'Refill not found' };
    }
  }

  if (ids.length === 1 && ids[0] in byId) {
    const v = byId[String(ids[0])];
    if ('status' in v) return NextResponse.json({ status: v.status });
    return NextResponse.json(v);
  }
  return NextResponse.json(
    refills.map((r) => ({ refill: r.id, status: r.status }))
  );
}

async function handleCancel(params: Params, user: { id: number }) {
  const ordersParam = params.orders || params.order || params.orderId;
  if (!ordersParam) return apiError('Missing orders parameter');

  const ids = ordersParam
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
    .slice(0, 100);

  if (ids.length === 0) return apiError('Invalid orders parameter');

  const reason = 'API cancellation request';

  const [orders, existingCancels] = await Promise.all([
    db.newOrders.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        userId: true,
        status: true,
        service: { select: { cancel: true } },
      },
    }),
    db.cancelRequests.findMany({
      where: { orderId: { in: ids }, status: 'pending' },
      select: { orderId: true },
    }),
  ]);

  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const existingOrderIds = new Set(existingCancels.map((c) => c.orderId));

  const results: Array<{ order: number; cancel?: number; error?: string }> = [];

  for (const orderId of ids) {
    const order = orderMap.get(orderId);

    if (!order || order.userId !== user.id) {
      results.push({ order: orderId, error: 'Incorrect order ID' });
      continue;
    }
    if (!order.service?.cancel) {
      results.push({ order: orderId, error: 'Service does not support cancel' });
      continue;
    }
    if (['completed', 'canceled', 'cancelled'].includes(order.status || '')) {
      results.push({ order: orderId, error: 'Order cannot be cancelled' });
      continue;
    }
    if (existingOrderIds.has(orderId)) {
      results.push({ order: orderId, error: 'Cancel already requested' });
      continue;
    }

    await db.cancelRequests.create({
      data: { orderId, userId: user.id, reason, status: 'pending' },
    });
    results.push({ order: orderId, cancel: 1 });
  }

  if (results.length === 1) {
    const r = results[0];
    if (r.cancel !== undefined) return NextResponse.json({ cancel: 1 });
    return NextResponse.json({ error: r.error });
  }
  return NextResponse.json(results);
}

async function handleBalance(user: { balance: number; currency: string }) {
  return NextResponse.json({
    balance: user.balance.toFixed(5),
    currency: user.currency || 'USD',
  });
}
