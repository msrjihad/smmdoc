import { auth } from '@/auth';
import { ActivityLogger } from '@/lib/activity-logger';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { validateOrderByType, getServiceTypeConfig } from '@/lib/service-types';
import { ProviderOrderForwarder } from '@/lib/utils/provider-order-forwarder';
import { convertFromUSD, convertToUSD, fetchCurrencyData } from '@/lib/currency-utils';
import { sendNewOrderNotification } from '@/lib/notifications/user-notifications';

export async function POST(request: Request) {
  try {
    console.log('Order creation request received');
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const user = await db.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        balance: true,
        currency: true,
        dollarRate: true,
        total_spent: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found', data: null },
        { status: 404 }
      );
    }

    const body = await request.json();

    const isMultipleOrders = Array.isArray(body);
    const orders = isMultipleOrders ? body : [body];

    const uniqueServiceIds = [...new Set(orders.map((o: any) => o.serviceId).filter(Boolean))];
    const servicesList = uniqueServiceIds.length > 0
      ? await db.services.findMany({
          where: { id: { in: uniqueServiceIds } },
          select: {
            id: true,
            name: true,
            rate: true,
            min_order: true,
            max_order: true,
            avg_time: true,
            status: true,
            providerId: true,
            packageType: true,
            providerServiceId: true,
          },
        })
      : [];
    const serviceMap = new Map(servicesList.map((s) => [s.id, s]));

    const uniqueProviderIds = [...new Set(servicesList.map((s) => s.providerId).filter((id): id is number => id != null))];
    const providersList = uniqueProviderIds.length > 0
      ? await db.apiProviders.findMany({
          where: { id: { in: uniqueProviderIds } },
          select: {
            id: true,
            name: true,
            api_url: true,
            api_key: true,
            status: true,
            timeout_seconds: true,
          },
        })
      : [];
    const providerMap = new Map(providersList.map((p) => [p.id, p]));

    for (const orderData of orders) {
      const { 
        categoryId, 
        serviceId, 
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
      } = orderData;

      if (!categoryId || !serviceId || !link || !qty) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Missing required fields: categoryId, serviceId, link, qty',
            data: null,
          },
          { status: 400 }
        );
      }

      const service = serviceMap.get(serviceId);

      if (!service) {
        return NextResponse.json(
          {
            success: false,
            message: `Service not found: ${serviceId}`,
            data: null,
          },
          { status: 404 }
        );
      }

      if (service.status !== 'active') {
        return NextResponse.json(
          {
            success: false,
            message: `Service is not active: ${service.name}`,
            data: null,
          },
          { status: 400 }
        );
      }

      if (qty < service.min_order || qty > service.max_order) {
        return NextResponse.json(
          {
            success: false,
            message: `Quantity for ${service.name} must be between ${service.min_order} and ${service.max_order}`,
            data: null,
          },
          { status: 400 }
        );
      }

      const serviceTypeId = service.packageType || 1;
      const typeConfig = getServiceTypeConfig(serviceTypeId);
      const validationData = {
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
        ? validateOrderByType(serviceTypeId, validationData)
        : { general: 'Invalid service type' };

      if (errors && Object.keys(errors).length > 0) {
        const errorMessages = Object.values(errors).join(', ');
        return NextResponse.json(
          {
            success: false,
            message: `Service type validation failed for ${service.name}: ${errorMessages}`,
            data: null,
          },
          { status: 400 }
        );
      }
    }

    let currencies: any[] = [];
    try {
      const currencyData = await fetchCurrencyData();
      currencies = currencyData.currencies || [];
    } catch (currencyError) {
      console.error('Error fetching currency data:', currencyError);
      currencies = [
        { id: 1, code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0000, enabled: true },
        { id: 2, code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 110.0000, enabled: true },
        { id: 3, code: 'USDT', name: 'Tether USD', symbol: '₮', rate: 1.0000, enabled: true },
      ];
    }
    
    let totalCost = 0;
    const processedOrders: any[] = [];

    for (const orderData of orders) {
      const {
        categoryId,
        serviceId,
        link,
        qty,
        price,
        usdPrice,
        currency,
        avg_time,
        comments,
        username,
        posts,
        delay,
        minQty,
        maxQty,
        isDripfeed = false,
        dripfeedRuns,
        dripfeedInterval,
        isSubscription = false,
      } = orderData;

      const serviceForPrice = serviceMap.get(serviceId);
      const calculatedUsdPrice = usdPrice || (serviceForPrice!.rate * qty) / 1000;

      let finalPrice;
      if (user.currency === 'USD' || user.currency === 'USDT') {
        finalPrice = calculatedUsdPrice;
      } else {
        finalPrice = convertFromUSD(calculatedUsdPrice, user.currency, currencies);
      }

      totalCost += finalPrice;

      const qtyNum = Number(qty);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        throw new Error(`Invalid quantity in order data: ${qty}`);
      }

      processedOrders.push({
        categoryId: parseInt(String(categoryId)),
        serviceId: parseInt(String(serviceId)),
        userId: parseInt(String(session.user.id)),
        link: String(link || ''),
        qty: BigInt(Math.floor(qtyNum)),
        price: Number(finalPrice),
        usdPrice: Number(calculatedUsdPrice),
        currency: String(user.currency || 'USD'),
        avg_time: String(avg_time || serviceForPrice!.avg_time || 'N/A'),
        status: 'pending',
        remains: BigInt(Math.floor(qtyNum)),
        startCount: BigInt(0),
        packageType: Number(serviceForPrice!.packageType || 1),
        comments: comments ? String(comments) : null,
        username: username ? String(username) : null,
        posts: posts ? parseInt(String(posts)) : null,
        delay: delay ? parseInt(String(delay)) : null,
        minQty: minQty && !isNaN(Number(minQty)) ? BigInt(Math.floor(Number(minQty))) : null,
        maxQty: maxQty && !isNaN(Number(maxQty)) ? BigInt(Math.floor(Number(maxQty))) : null,
        isDripfeed: Boolean(isDripfeed || false),
        dripfeedRuns: dripfeedRuns ? parseInt(String(dripfeedRuns)) : null,
        dripfeedInterval: dripfeedInterval ? parseInt(String(dripfeedInterval)) : null,
        isSubscription: Boolean(isSubscription || false),
        subscriptionStatus: isSubscription ? 'active' : null,
      });
    }

    console.log('Order creation debug:', {
      userCurrency: user.currency,
      userBalance: user.balance,
      totalCost,
      processedOrders: processedOrders.map(o => ({
        currency: o.currency,
        price: o.price,
        usdPrice: o.usdPrice
      })),
      originalOrders: orders.map(o => ({ currency: o.currency, price: o.price }))
    });

    const userCurrencyData = currencies.find(c => c.code === user.currency);
    const userCurrencyRate = userCurrencyData?.rate || 1;
    
    let availableBalance = user.balance;
    if (user.currency !== 'USD' && user.currency !== 'USDT') {
      availableBalance = convertFromUSD(user.balance, user.currency, currencies);
    }

    if (availableBalance < totalCost) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient balance. Required: ${totalCost.toFixed(
            2
          )} ${user.currency}, Available: ${availableBalance.toFixed(2)} ${user.currency}`,
          data: null,
        },
        { status: 400 }
      );
    }

    const providerDataArray: Array<{
      providerOrderId: string | null;
      providerStatus: string;
      apiCharge: number;
      profit: number;
      startCount: number;
      remains: number;
      orderError: string | null;
      serviceProviderId: number | null;
    }> = [];
    
    for (let i = 0; i < processedOrders.length; i++) {
      try {
        const orderData = processedOrders[i];
        let providerOrderId: string | null = null;
        let providerStatus = 'pending';
        let apiCharge = 0;
        let profit = orderData.price;
        let startCount = orderData.startCount ? BigInt(orderData.startCount.toString()) : BigInt(0);
        let remains = orderData.remains || orderData.qty;
        let orderError: string | null = null;
        let serviceProviderId: number | null = null;

        console.log(`Processing order ${i + 1}/${processedOrders.length} for service ${orderData.serviceId}...`);

        const service = serviceMap.get(orderData.serviceId);

        if (!service) {
          throw new Error(`Service ${orderData.serviceId} not found`);
        }

        const providerServiceId = service.providerServiceId || (service as any).api_service || null;
        const providerServiceIdStr = providerServiceId ? String(providerServiceId).trim() : null;
        const hasValidProviderServiceId = providerServiceIdStr && providerServiceIdStr !== '';
        
        const finalProviderServiceId = hasValidProviderServiceId ? providerServiceIdStr : String(service.id);
        
        console.log(`Checking provider forwarding for service ${service.id}:`, {
          providerId: service?.providerId,
          providerServiceId: providerServiceId,
          providerServiceIdStr: providerServiceIdStr,
          finalProviderServiceId: finalProviderServiceId,
          hasProvider: !!service?.providerId,
          hasProviderServiceId: hasValidProviderServiceId,
          serviceName: service.name
        });
        
        if (service?.providerId) {
          if (!hasValidProviderServiceId) {
            console.warn(`Service ${service.id} has providerId (${service.providerId}) but no valid providerServiceId. Using service ID (${service.id}) as fallback for provider service ID.`);
          }
        }
        
        console.log(`Service provider check - providerId: ${service.providerId}, type: ${typeof service.providerId}, truthy: ${!!service.providerId}`);
        
        if (service?.providerId !== null && service?.providerId !== undefined) {
          try {
          console.log(`Service has providerId: ${service.providerId}, proceeding with forwarding...`);
          const provider = providerMap.get(service.providerId);

          if (!provider) {
            throw new Error(`Provider ${service.providerId} not found`);
          }

          if (provider.status !== 'active') {
            throw new Error(`Provider ${provider.name} is not active`);
          }

          serviceProviderId = service.providerId;

          const providerForApi: any = {
            id: provider.id,
            name: provider.name,
            api_url: provider.api_url,
            api_key: provider.api_key,
            status: provider.status,
            api_type: (provider as any).api_type || (provider as any).apiType || 1,
            timeout_seconds: (provider as any).timeout_seconds || 30
          };

          const forwarder = ProviderOrderForwarder.getInstance();

          let shouldForward = true;
          try {
            console.log(`Checking provider balance for ${provider.name}...`);
            const providerBalance = await forwarder.getProviderBalance(providerForApi);
            const qtyNum = typeof orderData.qty === 'bigint' ? Number(orderData.qty) : Number(orderData.qty);
            const orderCost = orderData.usdPrice || (service.rate * qtyNum) / 1000;

            console.log(`Provider balance check result:`, {
              providerName: provider.name,
              providerBalance: providerBalance,
              orderCost: orderCost,
              sufficient: providerBalance >= orderCost
            });

            if (providerBalance < orderCost) {
              console.log(`Provider ${provider.name} has insufficient balance. Required: ${orderCost.toFixed(2)}, Available: ${providerBalance.toFixed(2)}. Order will be stored but not forwarded.`);
              shouldForward = false;
              orderError = `Provider has insufficient balance. Required: ${orderCost.toFixed(2)}, Available: ${providerBalance.toFixed(2)}`;
              apiCharge = 0;
              profit = orderData.price;
            } else {
              console.log(`Provider ${provider.name} has sufficient balance (${providerBalance.toFixed(2)}). Proceeding with order forwarding...`);
            }

            if (providerBalance < 50) {
              try {
                const { sendAdminApiBalanceAlertNotification } = await import('@/lib/notifications/admin-notifications');
                await sendAdminApiBalanceAlertNotification(
                  provider.name,
                  providerBalance
                );
              } catch (notificationError) {
                console.error('Error sending API balance alert notification:', notificationError);
              }
            }
          } catch (balanceError) {
            console.error('Error checking provider balance:', balanceError);
            const errorMessage = balanceError instanceof Error ? balanceError.message : 'Unknown error';
            console.warn(`Balance check failed for ${provider.name}, but proceeding with order forwarding anyway. Error: ${errorMessage}`);
            shouldForward = true;
            orderError = null;
          }

          if (shouldForward) {
            const packageType = service.packageType || orderData.packageType || 1;
            const serviceOverflow = (service as any).service_overflow || (service as any).overflow || 0;
            const qtyNumForOverflow = typeof orderData.qty === 'bigint' ? Number(orderData.qty) : Number(orderData.qty);
            const serviceOverflowAmount = Math.floor((serviceOverflow / 100) * qtyNumForOverflow);
            const quantityWithOverflow = qtyNumForOverflow + serviceOverflowAmount;
            
            let quantity: number | undefined = quantityWithOverflow;
            let comments = orderData.comments;
            
            if (packageType === 2) {
              quantity = undefined;
            } else if (packageType === 3 || packageType === 4) {
              quantity = undefined;
            } else if (packageType === 11 || packageType === 12 || packageType === 13 || packageType === 14 || packageType === 15) {
              quantity = undefined;
            }
            
            const orderDataForProvider = {
              service: finalProviderServiceId,
              link: orderData.link,
              quantity: quantity,
              comments: comments,
              packageType: packageType,
              runs: orderData.dripfeedRuns || undefined,
              interval: orderData.dripfeedInterval || undefined
            };

            console.log(`Forwarding order to provider ${provider.name} (${provider.api_url}) before saving to database...`);
            console.log(`Order data for provider:`, {
              service: orderDataForProvider.service,
              link: orderDataForProvider.link,
              quantity: orderDataForProvider.quantity,
              comments: orderDataForProvider.comments,
              packageType: orderDataForProvider.packageType,
              runs: orderDataForProvider.runs,
              interval: orderDataForProvider.interval
            });
            
            try {
              const forwardResult = await forwarder.forwardOrderToProvider(providerForApi, orderDataForProvider);
              console.log(`Forward result from provider:`, {
                order: forwardResult.order,
                charge: forwardResult.charge,
                status: forwardResult.status,
                start_count: forwardResult.start_count,
                remains: forwardResult.remains
              });

              if (forwardResult.order && forwardResult.order !== '') {
                providerOrderId = forwardResult.order.toString();
                console.log(`Order created with provider order ID: ${providerOrderId}. Fetching status and charge...`);

                const statusResult = await forwarder.checkProviderOrderStatus(providerForApi, providerOrderId);
              
              const mapProviderStatus = (providerStatus: string): string => {
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
                  'fail': 'failed'
                };
                return statusMap[normalizedStatus] || 'pending';
              };

                providerStatus = mapProviderStatus(statusResult.status);
                apiCharge = statusResult.charge || forwardResult.charge || 0;
                const qtyNumForRemains = typeof orderData.qty === 'bigint' ? Number(orderData.qty) : Number(orderData.qty);
                startCount = BigInt(statusResult.start_count || forwardResult.start_count || 0);
                const providerRemains = statusResult.remains !== undefined ? statusResult.remains : forwardResult.remains;
                remains = BigInt(qtyNumForRemains);
                profit = orderData.price - apiCharge;

                console.log(`Order status fetched: ${providerStatus}, Charge: ${apiCharge}, Profit: ${profit}, StartCount: ${startCount}, Remains: ${remains}`);
              } else {
                console.log(`Order forwarded but no provider order ID returned (likely subscription/auto order). Using default values.`);
                providerStatus = 'pending';
                apiCharge = forwardResult.charge || 0;
                const qtyNumForDefault = typeof orderData.qty === 'bigint' ? Number(orderData.qty) : Number(orderData.qty);
                startCount = BigInt(forwardResult.start_count || 0);
                remains = BigInt(qtyNumForDefault);
                profit = orderData.price - apiCharge;
              }
            } catch (forwardError: any) {
              console.error(`Error forwarding order to provider:`, forwardError);
              const errorMessage = forwardError instanceof Error ? forwardError.message : String(forwardError);
              
              if (errorMessage.toLowerCase().includes('balance') || errorMessage.toLowerCase().includes('insufficient')) {
                orderError = `Provider has insufficient balance to process this order`;
              } else if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('network')) {
                orderError = `Provider API timeout or network error: ${errorMessage}`;
              } else {
                orderError = errorMessage;
              }
              
              apiCharge = 0;
              profit = orderData.price;
            }
          }
        } catch (providerError: any) {
          console.error(`CRITICAL: Error processing provider for order ${i + 1}:`, {
            error: providerError?.message || providerError,
            stack: providerError?.stack,
            serviceId: service.id,
            providerId: service.providerId,
            serviceName: service.name,
            errorName: providerError?.name,
            errorCode: (providerError as any)?.code
          });
          
          const errorMessage = providerError instanceof Error ? providerError.message : String(providerError);
          
          if (errorMessage.toLowerCase().includes('balance') || errorMessage.toLowerCase().includes('insufficient')) {
            orderError = `Provider has insufficient balance to process this order`;
          } else if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('network')) {
            orderError = `Provider API timeout or network error: ${errorMessage}`;
          } else {
            orderError = `Provider error: ${errorMessage}`;
          }
          
          apiCharge = 0;
          profit = orderData.price;
          
          console.warn(`Continuing with order creation despite provider error. Order will be stored with status 'pending' and error: ${orderError}`);
        }
      } else {
        console.log(`Service ${service.id} (${service.name}) has no providerId (${service.providerId}), using manual pricing. Order will be stored but not forwarded to provider.`);
        apiCharge = orderData.price;
        profit = 0;
      }

      providerDataArray.push({
        providerOrderId,
        providerStatus,
        apiCharge: Number(apiCharge),
        profit: Number(profit),
        startCount: typeof startCount === 'bigint' ? Number(startCount) : Number(startCount),
        remains: typeof remains === 'bigint' ? Number(remains) : Number(remains),
        orderError,
        serviceProviderId
      });
      } catch (providerLoopError: any) {
        console.error(`Error processing order ${i + 1} for provider forwarding:`, {
          error: providerLoopError?.message || providerLoopError,
          stack: providerLoopError?.stack,
          orderData: processedOrders[i] ? {
            serviceId: processedOrders[i].serviceId,
            categoryId: processedOrders[i].categoryId
          } : 'N/A'
        });
        
        providerDataArray.push({
          providerOrderId: null,
          providerStatus: 'pending',
          apiCharge: processedOrders[i]?.price || 0,
          profit: 0,
          startCount: 0,
          remains: processedOrders[i]?.qty || 0,
          orderError: providerLoopError instanceof Error ? providerLoopError.message : String(providerLoopError),
          serviceProviderId: null
        });
      }
    }

    let result;
    try {
      const moduleSettings = await db.moduleSettings.findFirst();
      const globalCommissionRate = moduleSettings?.commissionRate ?? 5;

      result = await db.$transaction(async (prisma) => {
        const createdOrders = [];
        
        for (let i = 0; i < processedOrders.length; i++) {
          const orderData = processedOrders[i];
          const providerData = providerDataArray[i];
          
          if (!orderData || !providerData) {
            throw new Error(`Missing order data or provider data for order ${i + 1}`);
          }
        const {
          providerOrderId,
          providerStatus,
          apiCharge,
          profit,
          startCount,
          remains,
          orderError,
          serviceProviderId
        } = providerData;

        console.log(`Creating order in database with data:`, {
          serviceId: orderData.serviceId,
          categoryId: orderData.categoryId,
          userId: orderData.userId,
          providerOrderId,
          providerStatus,
          status: orderError ? 'failed' : providerStatus,
          charge: apiCharge > 0 ? apiCharge : orderData.price,
          profit
        });

        if (!orderData.categoryId || !orderData.serviceId || !orderData.userId || !orderData.link) {
          throw new Error(`Missing required fields for order ${i + 1}: categoryId=${orderData.categoryId}, serviceId=${orderData.serviceId}, userId=${orderData.userId}, link=${orderData.link ? 'present' : 'missing'}`);
        }

        const categoryIdNum = parseInt(String(orderData.categoryId));
        const serviceIdNum = parseInt(String(orderData.serviceId));
        const userIdNum = parseInt(String(orderData.userId));
        
        if (isNaN(categoryIdNum) || isNaN(serviceIdNum) || isNaN(userIdNum)) {
          throw new Error(`Invalid IDs for order ${i + 1}: categoryId=${orderData.categoryId}, serviceId=${orderData.serviceId}, userId=${orderData.userId}`);
        }

        if (orderData.price === undefined || orderData.price === null || isNaN(Number(orderData.price))) {
          throw new Error(`Invalid price for order ${i + 1}: ${orderData.price}`);
        }

        if (orderData.usdPrice === undefined || orderData.usdPrice === null || isNaN(Number(orderData.usdPrice))) {
          throw new Error(`Invalid usdPrice for order ${i + 1}: ${orderData.usdPrice}`);
        }

        if (!orderData.qty || Number(orderData.qty) <= 0) {
          throw new Error(`Invalid quantity for order ${i + 1}: ${orderData.qty}`);
        }

        const qtyNum = Number(orderData.qty);
        if (isNaN(qtyNum) || qtyNum <= 0) {
          throw new Error(`Invalid quantity value for order ${i + 1}: ${orderData.qty}`);
        }

        const orderQty = BigInt(Math.floor(qtyNum));
        const orderRemains = orderQty;

        const remainsValue: any = remains;
        console.log(`Setting remains for order ${i + 1}:`, {
          qty: orderQty.toString(),
          remains: orderRemains.toString(),
          providerRemains: typeof remainsValue === 'bigint' ? remainsValue.toString() : String(remainsValue || '0'),
          note: 'For new orders, remains always equals quantity'
        });

        const orderCreateData = {
          categoryId: categoryIdNum,
          serviceId: serviceIdNum,
          userId: userIdNum,
          link: String(orderData.link || ''),
          qty: orderQty,
          price: Number(orderData.price),
          avg_time: String(orderData.avg_time || 'N/A'),
          status: String(orderError ? 'failed' : providerStatus || 'pending'),
          remains: orderRemains,
          startCount: typeof startCount === 'bigint' ? startCount : BigInt(Math.floor(Number(startCount || 0))),
          currency: String(orderData.currency || 'USD'),
          usdPrice: Number(orderData.usdPrice),
          charge: apiCharge > 0 ? Number(apiCharge) : Number(orderData.price),
          profit: Number(profit || 0),
          packageType: Number(orderData.packageType || 1),
          comments: orderData.comments ? String(orderData.comments) : null,
          username: orderData.username ? String(orderData.username) : null,
          posts: orderData.posts ? parseInt(String(orderData.posts)) : null,
          delay: orderData.delay ? parseInt(String(orderData.delay)) : null,
          minQty: orderData.minQty && !isNaN(Number(orderData.minQty)) ? BigInt(Math.floor(Number(orderData.minQty))) : null,
          maxQty: orderData.maxQty && !isNaN(Number(orderData.maxQty)) ? BigInt(Math.floor(Number(orderData.maxQty))) : null,
          isDripfeed: Boolean(orderData.isDripfeed || false),
          dripfeedRuns: orderData.dripfeedRuns ? parseInt(String(orderData.dripfeedRuns)) : null,
          dripfeedInterval: orderData.dripfeedInterval ? parseInt(String(orderData.dripfeedInterval)) : null,
          isSubscription: Boolean(orderData.isSubscription || false),
          subscriptionStatus: orderData.isSubscription ? String(orderData.subscriptionStatus || 'active') : null,
          providerOrderId: providerOrderId ? String(providerOrderId) : null,
          providerStatus: orderError ? 'forward_failed' : String(providerStatus || 'pending'),
          apiResponse: orderError ? String(JSON.stringify({ error: orderError })) : null,
          lastSyncAt: providerOrderId ? new Date() : null,
        };

        console.log(`Order create data prepared:`, {
          categoryId: orderCreateData.categoryId,
          serviceId: orderCreateData.serviceId,
          userId: orderCreateData.userId,
          hasLink: !!orderCreateData.link,
          qty: orderCreateData.qty,
          price: orderCreateData.price
        });

        const order = await prisma.newOrders.create({
          data: orderCreateData,
          include: {
            service: {
              select: {
                id: true,
                name: true,
                rate: true,
                providerId: true,
              },
            },
            category: {
              select: {
                id: true,
                category_name: true,
              },
            },
          },
        });

        console.log(`Order ${order.id} created successfully`);

        if (orderError && order.status === 'failed') {
          try {
            const { sendAdminFailOrderNotification } = await import('@/lib/notifications/admin-notifications');
            const user = await prisma.users.findUnique({
              where: { id: userIdNum },
              select: { username: true, name: true }
            });
            await sendAdminFailOrderNotification(
              order.id,
              order.service.name || 'Service',
              user?.username || user?.name || 'User'
            );
          } catch (notificationError) {
            console.error('Error sending admin fail order notification:', notificationError);
          }
        }

        if (serviceProviderId) {
          try {
            await prisma.providerOrderLogs.create({
              data: {
                orderId: order.id,
                providerId: serviceProviderId,
                action: 'forward_order',
                status: orderError ? 'failed' : 'success',
                errorMessage: orderError || null,
                response: JSON.stringify({ 
                  order: providerOrderId, 
                  status: providerStatus, 
                  charge: apiCharge,
                  error: orderError || null
                }),
                createdAt: new Date()
              }
            });
          } catch (logError) {
            console.warn(`Failed to create provider order log:`, logError);
          }
        }

        try {
          const userId = parseInt(session.user.id);
          console.log(`[AFFILIATE_COMMISSION] Checking for referral for user ${userId}, order ${order.id}`);
          
          const moduleSettings = await prisma.moduleSettings.findFirst();
          const affiliateSystemEnabled = moduleSettings?.affiliateSystemEnabled ?? false;
          console.log(`[AFFILIATE_COMMISSION] Affiliate system enabled: ${affiliateSystemEnabled}`);

          if (affiliateSystemEnabled) {
            const referral = await prisma.affiliateReferrals.findUnique({
              where: { referredUserId: userId },
              include: {
                affiliate: {
                  select: {
                    id: true,
                    status: true,
                    commissionRate: true,
                  }
                }
              }
            });

            console.log(`[AFFILIATE_COMMISSION] Referral lookup result:`, {
              found: !!referral,
              affiliateId: referral?.affiliateId,
              affiliateStatus: referral?.affiliate?.status,
              commissionRate: referral?.affiliate?.commissionRate
            });

            if (referral && referral.affiliate && referral.affiliate.status === 'active') {
              const servicePurchaseEarningCount = moduleSettings?.servicePurchaseEarningCount ?? '1';
              const earningLimit = servicePurchaseEarningCount === 'unlimited' ? null : parseInt(servicePurchaseEarningCount, 10);

              const existingCommissionsCount = await prisma.affiliateCommissions.count({
                where: {
                  affiliateId: referral.affiliate.id,
                  referredUserId: userId,
                }
              });

              console.log(`[AFFILIATE_COMMISSION] Commission count check:`, {
                existingCommissionsCount,
                earningLimit: earningLimit ?? 'unlimited',
                canCreateCommission: earningLimit === null || existingCommissionsCount < earningLimit
              });

              const canCreateCommission = earningLimit === null || existingCommissionsCount < earningLimit;

              if (canCreateCommission) {
                const orderAmount = orderData.usdPrice || orderData.price || 0;
                const commissionRate = globalCommissionRate;
                const commissionAmount = (orderAmount * commissionRate) / 100;

                console.log(`[AFFILIATE_COMMISSION] Commission calculation:`, {
                  orderAmount,
                  commissionRate,
                  commissionAmount,
                  commissionNumber: existingCommissionsCount + 1,
                  limit: earningLimit ?? 'unlimited'
                });

                if (commissionAmount > 0) {
                  const createdCommission = await prisma.affiliateCommissions.create({
                    data: {
                      affiliateId: referral.affiliate.id,
                      referredUserId: userId,
                      orderId: order.id,
                      amount: orderAmount,
                      commissionRate: commissionRate,
                      commissionAmount: commissionAmount,
                      status: 'pending',
                      updatedAt: new Date(),
                    }
                  });

                  console.log(`[AFFILIATE_COMMISSION] ✅ Commission created successfully:`, {
                    commissionId: createdCommission.id,
                    affiliateId: referral.affiliate.id,
                    orderId: order.id,
                    amount: orderAmount,
                    commissionAmount: commissionAmount,
                    status: 'pending',
                    commissionNumber: existingCommissionsCount + 1,
                    limit: earningLimit ?? 'unlimited'
                  });
                } else {
                  console.log(`[AFFILIATE_COMMISSION] ⚠️ Commission amount is 0, skipping creation`);
                }
              } else {
                console.log(`[AFFILIATE_COMMISSION] ⚠️ Commission limit reached for referred user ${userId} (${existingCommissionsCount}/${earningLimit}). Skipping commission for order ${order.id}.`);
              }
            } else {
              console.log(`[AFFILIATE_COMMISSION] ⚠️ No active referral found for user ${userId}`);
            }
          } else {
            console.log(`[AFFILIATE_COMMISSION] ⚠️ Affiliate system is disabled`);
          }
        } catch (affiliateError) {
          console.error('[AFFILIATE_COMMISSION] ❌ Error creating affiliate commission:', affiliateError);
          console.error('[AFFILIATE_COMMISSION] Error stack:', affiliateError instanceof Error ? affiliateError.stack : 'No stack trace');
        }

        createdOrders.push(order);
      }

      let totalUsdCost = 0;
      for (const orderData of processedOrders) {
        totalUsdCost += orderData.usdPrice || 0;
      }
      
      let balanceDeductionAmountUSD = totalUsdCost;
      if (user.currency !== 'USD' && user.currency !== 'USDT') {
        balanceDeductionAmountUSD = convertToUSD(totalCost, user.currency, currencies);
      } else {
        balanceDeductionAmountUSD = totalCost;
      }

      console.log('About to deduct balance:', {
        userId: session.user.id,
        userCurrency: user.currency,
        currentBalance: user.balance,
        totalCostInUserCurrency: totalCost,
        balanceDeductionAmountUSD: balanceDeductionAmountUSD,
        willDeduct: true
      });

      await prisma.users.update({
        where: { id: parseInt(session.user.id) },
        data: {
          balance: {
            decrement: balanceDeductionAmountUSD,
          },
          total_spent: {
            increment: balanceDeductionAmountUSD,
          },
        },
      });

        return createdOrders;
      });
    } catch (transactionError: any) {
      console.error('Transaction error details:', {
        message: transactionError?.message,
        stack: transactionError?.stack,
        code: transactionError?.code,
        meta: transactionError?.meta,
        error: transactionError
      });
      throw transactionError;
    }

    console.log(
      `User ${session.user.email} created ${result.length} order(s)`,
      {
        userId: session.user.id,
        orderCount: result.length,
        totalCost,
        orderIds: result.map((o) => o.id),
        timestamp: new Date().toISOString(),
      }
    );
    

    try {
      const username = session.user.username || session.user.email?.split('@')[0] || `user${session.user.id}`;
      await ActivityLogger.orderCreated(
        session.user.id,
        username,
        result.length,
        totalCost,
        user.currency
      );
    } catch (error) {
      console.error('Failed to log order creation activity:', error);
    }

    for (const order of result) {
      if (order.service?.name) {
        sendNewOrderNotification(
          parseInt(session.user.id),
          order.id,
          order.service.name
        ).catch(err => {
          console.error('Failed to send new order notification:', err);
        });
      }
    }

    const serializeOrder = (order: any) => {
      return {
        ...order,
        qty: typeof order.qty === 'bigint' ? order.qty.toString() : order.qty,
        remains: typeof order.remains === 'bigint' ? order.remains.toString() : order.remains,
        startCount: typeof order.startCount === 'bigint' ? order.startCount.toString() : order.startCount,
        minQty: order.minQty && typeof order.minQty === 'bigint' ? order.minQty.toString() : order.minQty,
        maxQty: order.maxQty && typeof order.maxQty === 'bigint' ? order.maxQty.toString() : order.maxQty,
      };
    };

    const serializedResult = Array.isArray(result) 
      ? result.map(serializeOrder)
      : serializeOrder(result);

    return NextResponse.json(
      {
        success: true,
        message: `${result.length} order(s) created successfully`,
        data: isMultipleOrders ? serializedResult : (Array.isArray(serializedResult) ? serializedResult[0] : serializedResult),
        summary: {
          orderCount: result.length,
          totalCost,
          currency: user.currency,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating order(s):', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = error?.code || error?.meta?.code || undefined;
    const errorMeta = error?.meta || undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      code: errorCode,
      meta: errorMeta,
      error: error
    });
    
    let userFriendlyMessage = 'Error creating order(s)';
    let statusCode = 500;
    
    if (errorCode === 'P2002') {
      userFriendlyMessage = 'Duplicate order detected. Please try again.';
      statusCode = 400;
    } else if (errorCode === 'P2003') {
      userFriendlyMessage = 'Invalid service or category. Please refresh and try again.';
      statusCode = 400;
    } else if (errorMessage.includes('categoryId') || errorMessage.includes('serviceId')) {
      userFriendlyMessage = 'Invalid service or category selected.';
      statusCode = 400;
    } else if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
      userFriendlyMessage = errorMessage;
      statusCode = 400;
    } else if (errorMessage.includes('Cannot convert') || errorMessage.includes('BigInt') || errorMessage.includes('Invalid value') || errorMessage.includes('Invalid order data format') || errorMessage.includes('Invalid IDs') || errorMessage.includes('Invalid price') || errorMessage.includes('Invalid quantity')) {
      userFriendlyMessage = errorMessage;
      statusCode = 400;
    } else if (errorMessage.includes('Required') || errorMessage.includes('missing') || errorMessage.includes('Null constraint')) {
      userFriendlyMessage = `Missing required information: ${errorMessage}`;
      statusCode = 400;
    }
    
    try {
      return NextResponse.json(
        {
          success: false,
          message: userFriendlyMessage,
          error: errorMessage,
          code: errorCode,
          details: process.env.NODE_ENV === 'development' ? {
            stack: errorStack,
            meta: errorMeta,
            errorName: error?.name
          } : undefined,
        },
        { status: statusCode }
      );
    } catch (jsonError) {
      console.error('Error creating error response:', jsonError);
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: userFriendlyMessage,
          error: errorMessage
        }),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
