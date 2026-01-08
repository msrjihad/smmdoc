import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { validateOrderByType, getServiceTypeConfig } from '@/lib/service-types';
import { ProviderOrderForwarder } from '@/lib/utils/provider-order-forwarder';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
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
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');
    const serviceId = searchParams.get('serviceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const skip = (page - 1) * limit;
    
    const whereClause: any = {};
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    if (serviceId) {
      whereClause.serviceId = serviceId;
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    if (search) {
      const searchTrimmed = search.trim();
      if (searchTrimmed.length > 0) {
        whereClause.OR = [
          { link: { contains: searchTrimmed, mode: 'insensitive' } },
          { user: { name: { contains: searchTrimmed, mode: 'insensitive' } } },
          { user: { email: { contains: searchTrimmed, mode: 'insensitive' } } },
          { service: { name: { contains: searchTrimmed, mode: 'insensitive' } } }
        ];
      }
    }
    
    const queryStartTime = Date.now();
    console.log('Fetching orders with whereClause:', JSON.stringify(whereClause, null, 2));

    const [orders, totalCount] = await Promise.all([
      db.newOrders.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
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
          },
          refillRequests: {
            select: {
              id: true,
              status: true
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.newOrders.count({ where: whereClause })
    ]);

    const queryTime = Date.now() - queryStartTime;
    console.log(`Orders query completed in ${queryTime}ms. Found: ${orders.length}, Total count: ${totalCount}`);

    const uniqueOrders = orders.filter((order, index, self) =>
      index === self.findIndex(o => o.id === order.id)
    );

    const totalPages = Math.ceil(totalCount / limit);

    const serializedOrders = uniqueOrders.map(order => ({
      ...order,
      qty: typeof order.qty === 'bigint' ? order.qty.toString() : order.qty,
      remains: typeof order.remains === 'bigint' ? order.remains.toString() : order.remains,
      startCount: typeof order.startCount === 'bigint' ? order.startCount.toString() : order.startCount,
      minQty: order.minQty && typeof order.minQty === 'bigint' ? order.minQty.toString() : order.minQty,
      maxQty: order.maxQty && typeof order.maxQty === 'bigint' ? order.maxQty.toString() : order.maxQty,
      service: order.service ? {
        ...order.service,
        min_order: typeof order.service.min_order === 'bigint' ? order.service.min_order.toString() : order.service.min_order,
        max_order: typeof order.service.max_order === 'bigint' ? order.service.max_order.toString() : order.service.max_order,
      } : order.service,
    }));

    return NextResponse.json({
      success: true,
      data: serializedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      error: null
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    
    const body = await req.json();
    const { 
      userId, 
      categoryId, 
      serviceId, 
      link, 
      qty, 
      price, 
      usdPrice, 
      currency, 
      avg_time,
      status = 'pending',
      skipBalanceCheck = false,
      comments,
      username,
      posts,
      delay,
      minQty,
      maxQty,
      isDripfeed = false,
      dripfeedRuns,
      dripfeedInterval,
      isSubscription = false
    } = body;
    
    if (!userId || !categoryId || !serviceId || !link || !qty) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: userId, categoryId, serviceId, link, qty',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    const service = await db.services.findUnique({
      where: { id: serviceId },
      include: { 
        category: true
      }
    });
    
    if (!service) {
      return NextResponse.json(
        { 
          error: 'Service not found',
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }
    
    if (service.status !== 'active') {
      return NextResponse.json(
        { 
          error: 'Service is not active',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    if (qty < service.min_order || qty > service.max_order) {
      return NextResponse.json(
        { 
          error: `Quantity must be between ${service.min_order} and ${service.max_order}`,
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const serviceTypeId = service.packageType || 1;
    const typeConfig = getServiceTypeConfig(serviceTypeId);
    const orderData = {
      link,
      qty,
      comments,
      username,
      posts,
      delay,
      minQty,
      maxQty,
      isDripfeed,
      dripfeedRuns,
      dripfeedInterval,
      isSubscription
    };

    const errors = typeConfig
      ? validateOrderByType(serviceTypeId, orderData)
      : { general: 'Invalid service type' };
    if (errors && Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join(', ');
      return NextResponse.json(
        {
          error: errorMessages,
          success: false,
          data: null
        },
        { status: 400 }
      );
    }
    
    const user = await db.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        currency: true,
        dollarRate: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'User not found',
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }
    
    const calculatedUsdPrice = usdPrice || (service.rate * qty) / 1000;
    const finalPrice = price || (user.currency === 'USD' ? calculatedUsdPrice : calculatedUsdPrice * (user.dollarRate || 121.52));
    
    if (!skipBalanceCheck) {
      const orderPrice = user.currency === 'USD' ? calculatedUsdPrice : calculatedUsdPrice * (user.dollarRate || 121.52);

      if (user.balance < orderPrice) {
        return NextResponse.json(
          {
            error: `Insufficient balance. Required: ${orderPrice.toFixed(2)}, Available: ${user.balance.toFixed(2)}`,
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }
    
    const order = await db.newOrders.create({
      data: {
        userId,
        categoryId,
        serviceId,
        link,
        qty: BigInt(qty.toString()),
        price: finalPrice,
        usdPrice: calculatedUsdPrice,
        currency: user.currency,
        avg_time: avg_time || service.avg_time,
        status,
        remains: BigInt(qty.toString()),
        startCount: BigInt(0),
        packageType: service.packageType || 1,
        comments: comments || null,
        username: username || null,
        posts: posts ? parseInt(posts) : null,
        delay: delay ? parseInt(delay) : null,
        minQty: minQty ? BigInt(minQty.toString()) : null,
        maxQty: maxQty ? BigInt(maxQty.toString()) : null,
        isDripfeed,
        dripfeedRuns: dripfeedRuns ? parseInt(dripfeedRuns) : null,
        dripfeedInterval: dripfeedInterval ? parseInt(dripfeedInterval) : null,
        isSubscription,
        subscriptionStatus: isSubscription ? 'active' : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true
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
    
    if (!skipBalanceCheck && status !== 'pending') {
      const orderPrice = user.currency === 'USD' ? calculatedUsdPrice : calculatedUsdPrice * (user.dollarRate || 121.52);

      await db.users.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: orderPrice
          },
          total_spent: {
            increment: orderPrice
          }
        }
      });
    }
    
    let updatedOrder = order;
    try {
      if (service.providerId && service.providerServiceId) {
        const apiProvider = await db.apiProviders.findUnique({
          where: { id: service.providerId }
        });

        if (apiProvider && apiProvider.status === 'active') {
          const forwarder = ProviderOrderForwarder.getInstance();
          const providerOrderData = {
            service: String(service.providerServiceId),
            link,
            quantity: typeof qty === 'bigint' ? Number(qty) : parseInt(qty),
            runs: isDripfeed && dripfeedRuns ? parseInt(dripfeedRuns) : undefined,
            interval: isDripfeed && dripfeedInterval ? parseInt(dripfeedInterval) : undefined
          };

          const providerForApi: any = {
            id: apiProvider.id,
            name: apiProvider.name,
            api_url: apiProvider.api_url,
            api_key: apiProvider.api_key,
            status: apiProvider.status
          };

          const providerRes = await forwarder.forwardOrderToProvider(providerForApi, providerOrderData);

          updatedOrder = await db.newOrders.update({
            where: { id: order.id },
            data: {
              status: providerRes.status || 'pending',
              providerOrderId: providerRes.order,
              providerStatus: providerRes.status,
              charge: providerRes.charge,
              lastSyncAt: new Date(),
              updatedAt: new Date()
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
              service: { select: { id: true, name: true, rate: true } },
              category: { select: { id: true, category_name: true } }
            }
          });

          console.log(
            `Admin ${session.user.email} forwarded order ${order.id} to provider ${apiProvider.name} -> Provider Order ${providerRes.order}`,
            { orderId: order.id, providerId: apiProvider.id, providerOrderId: providerRes.order, status: providerRes.status }
          );
        }
      }
    } catch (providerError) {
      const forwarder = ProviderOrderForwarder.getInstance();
      const errorMessage = forwarder.formatProviderError(providerError);

      updatedOrder = await db.newOrders.update({
        where: { id: order.id },
        data: {
          status: 'failed',
          providerStatus: 'failed',
          apiResponse: errorMessage,
          lastSyncAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          service: { select: { id: true, name: true, rate: true } },
          category: { select: { id: true, category_name: true } }
        }
      });

      try {
        const { sendAdminFailOrderNotification } = await import('@/lib/notifications/admin-notifications');
        await sendAdminFailOrderNotification(
          order.id,
          service.name || 'Service',
          updatedOrder.user.name || updatedOrder.user.email || 'User'
        );
      } catch (notificationError) {
        console.error('Error sending admin fail order notification:', notificationError);
      }

      console.error('Error forwarding order to provider:', providerError);
    }

    console.log(`Admin ${session.user.email} created order ${order.id} for user ${user.email}`, {
      orderId: order.id,
      userId,
      serviceId,
      amount: finalPrice,
      timestamp: new Date().toISOString()
    });

    const serializedOrder = {
      ...updatedOrder,
      qty: typeof updatedOrder.qty === 'bigint' ? updatedOrder.qty.toString() : updatedOrder.qty,
      remains: typeof updatedOrder.remains === 'bigint' ? updatedOrder.remains.toString() : updatedOrder.remains,
      startCount: typeof updatedOrder.startCount === 'bigint' ? updatedOrder.startCount.toString() : updatedOrder.startCount,
      minQty: updatedOrder.minQty && typeof updatedOrder.minQty === 'bigint' ? updatedOrder.minQty.toString() : updatedOrder.minQty,
      maxQty: updatedOrder.maxQty && typeof updatedOrder.maxQty === 'bigint' ? updatedOrder.maxQty.toString() : updatedOrder.maxQty,
    };

    try {
      const { sendAdminNewManualServiceOrderNotification } = await import('@/lib/notifications/admin-notifications');
      await sendAdminNewManualServiceOrderNotification(
        updatedOrder.id,
        service.name || 'Service',
        order.user.name || order.user.email || 'User'
      );
    } catch (notificationError) {
      console.error('Error sending admin new manual service order notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: serializedOrder,
      error: null
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        error: 'Failed to create order: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
