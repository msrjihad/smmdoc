import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { convertFromUSD, fetchCurrencyData } from '@/lib/currency-utils';
import { ProviderOrderForwarder } from '@/lib/utils/provider-order-forwarder';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const { reason, refillType = 'full', customQuantity } = body;
    
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Order ID is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    const originalOrder = await db.newOrders.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            currency: true,
            dollarRate: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true,
            min_order: true,
            max_order: true,
            avg_time: true,
            status: true,
            providerId: true,
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
    
    if (!originalOrder) {
      return NextResponse.json(
        { 
          error: 'Order not found',
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }
    
    const eligibleStatuses = ['completed', 'partial'];
    if (!eligibleStatuses.includes(originalOrder.status)) {
      return NextResponse.json(
        { 
          error: `Order must be completed or partial to be refilled. Current status: ${originalOrder.status}`,
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    if (originalOrder.service.status !== 'active') {
      return NextResponse.json(
        { 
          error: 'Service is no longer active and cannot be refilled',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    let refillQuantity: number;
    
    switch (refillType) {
      case 'full':
        refillQuantity = Number(originalOrder.qty);
        break;
      case 'remaining':
        refillQuantity = Number(originalOrder.remains);
        break;
      case 'custom':
        if (!customQuantity || customQuantity <= 0) {
          return NextResponse.json(
            { 
              error: 'Custom quantity must be provided and greater than 0',
              success: false,
              data: null 
            },
            { status: 400 }
          );
        }
        refillQuantity = parseInt(customQuantity);
        break;
      default:
        return NextResponse.json(
          { 
            error: 'Invalid refill type. Must be: full, remaining, or custom',
            success: false,
            data: null 
          },
          { status: 400 }
        );
    }
    
    if (refillQuantity < originalOrder.service.min_order || refillQuantity > originalOrder.service.max_order) {
      return NextResponse.json(
        { 
          error: `Refill quantity must be between ${originalOrder.service.min_order} and ${originalOrder.service.max_order}`,
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    const { currencies } = await fetchCurrencyData();
    
    const refillRate = originalOrder.service.rate;
    const refillUsdPrice = (refillRate * refillQuantity) / 1000;
    const refillPrice = originalOrder.user.currency === 'USD' || originalOrder.user.currency === 'USDT' 
      ? refillUsdPrice 
      : convertFromUSD(refillUsdPrice, originalOrder.user.currency, currencies);
    
    if (originalOrder.user.balance < refillPrice) {
      return NextResponse.json(
        { 
          error: `Insufficient balance for refill. Required: ${refillPrice.toFixed(2)}, Available: ${originalOrder.user.balance.toFixed(2)}`,
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    const result = await db.$transaction(async (prisma) => {
      const refillOrder = await prisma.newOrders.create({
        data: {
          userId: originalOrder.userId,
          categoryId: originalOrder.categoryId,
          serviceId: originalOrder.serviceId,
          link: originalOrder.link,
          qty: BigInt(refillQuantity),
          price: refillPrice,
          usdPrice: refillUsdPrice,
          currency: originalOrder.currency,
          avg_time: originalOrder.service.avg_time,
          status: 'processing',
          remains: BigInt(refillQuantity),
          startCount: BigInt(0),
          dripfeedRuns: originalOrder.dripfeedRuns || null,
          dripfeedInterval: originalOrder.dripfeedInterval || null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              currency: true
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
      
      await prisma.users.update({
        where: { id: originalOrder.userId },
        data: {
          balance: {
            decrement: refillPrice
          },
          total_spent: {
            increment: refillPrice
          }
        }
      });
      
      return refillOrder;
    });

    // Forward refill order to provider API if service has provider
    let providerForwardResult = null;
    let providerError = null;

    if (originalOrder.service.providerId && originalOrder.service.providerServiceId) {
      try {
        const provider = await db.apiProviders.findUnique({
          where: { id: originalOrder.service.providerId }
        });

        if (provider && provider.status === 'active') {
          const forwarder = ProviderOrderForwarder.getInstance();
          
          const providerForApi: any = {
            id: provider.id,
            name: provider.name,
            api_url: provider.api_url,
            api_key: provider.api_key,
            status: provider.status,
            api_type: (provider as any).api_type || (provider as any).apiType || 1,
            timeout_seconds: (provider as any).timeout_seconds || 30
          };

          const orderDataForProvider = {
            service: String(originalOrder.service.providerServiceId),
            link: originalOrder.link,
            quantity: refillQuantity,
            runs: originalOrder.dripfeedRuns ? Number(originalOrder.dripfeedRuns) : undefined,
            interval: originalOrder.dripfeedInterval ? Number(originalOrder.dripfeedInterval) : undefined
          };

          console.log('Forwarding refill order to provider:', {
            providerId: provider.id,
            providerName: provider.name,
            refillOrderId: result.id,
            originalOrderId: originalOrder.id,
            orderData: orderDataForProvider
          });

          const forwardResult = await forwarder.forwardOrderToProvider(providerForApi, orderDataForProvider);
          
          console.log('Refill order forwarded to provider successfully:', {
            refillOrderId: result.id,
            providerOrderId: forwardResult.order,
            status: forwardResult.status,
            charge: forwardResult.charge
          });

          if (forwardResult.order && forwardResult.order !== '') {
            // Check provider order status to get accurate data
            let statusResult;
            try {
              statusResult = await forwarder.checkProviderOrderStatus(providerForApi, forwardResult.order);
            } catch (statusError) {
              console.warn('Failed to fetch provider order status, using forward result values:', statusError);
              statusResult = {
                charge: forwardResult.charge || 0,
                start_count: BigInt(forwardResult.start_count || 0),
                status: forwardResult.status || 'pending',
                remains: BigInt(forwardResult.remains || refillQuantity),
                currency: forwardResult.currency || 'USD'
              };
            }

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

            const providerStatus = mapProviderStatus(statusResult.status);
            const apiCharge = statusResult.charge || forwardResult.charge || 0;
            const startCount = BigInt(statusResult.start_count || forwardResult.start_count || 0);
            const remains = BigInt(statusResult.remains || forwardResult.remains || refillQuantity);
            const profit = refillPrice - apiCharge;

            // Update refill order with provider data
            await db.newOrders.update({
              where: { id: result.id },
              data: {
                providerOrderId: forwardResult.order.toString(),
                providerStatus: providerStatus,
                status: providerStatus,
                charge: apiCharge,
                profit: profit,
                startCount: startCount,
                remains: remains,
                lastSyncAt: new Date(),
                updatedAt: new Date()
              }
            });

            // Log provider order forwarding
            await db.providerOrderLogs.create({
              data: {
                orderId: result.id,
                providerId: provider.id,
                action: 'forward_refill_order',
                status: 'success',
                response: JSON.stringify({
                  providerOrderId: forwardResult.order,
                  status: providerStatus,
                  charge: apiCharge,
                  startCount: Number(startCount),
                  remains: Number(remains)
                }),
                createdAt: new Date()
              }
            });

            providerForwardResult = {
              providerOrderId: forwardResult.order,
              status: providerStatus,
              charge: apiCharge,
              profit: profit,
              startCount: Number(startCount),
              remains: Number(remains)
            };

            console.log('Refill order updated with provider data:', {
              refillOrderId: result.id,
              providerOrderId: forwardResult.order,
              providerStatus: providerStatus,
              apiCharge: apiCharge,
              profit: profit
            });
          } else {
            providerError = 'Provider did not return order ID';
            console.error('Provider refill forwarding failed:', providerError);
          }
        }
      } catch (error) {
        providerError = error instanceof Error ? error.message : 'Unknown error forwarding to provider';
        console.error('Error forwarding refill order to provider:', error);
        
        // Log the error
        try {
          await db.providerOrderLogs.create({
            data: {
              orderId: result.id,
              providerId: originalOrder.service.providerId,
              action: 'forward_refill_order',
              status: 'error',
              response: JSON.stringify({ error: providerError }),
              createdAt: new Date()
            }
          });
        } catch (logError) {
          console.error('Failed to log provider error:', logError);
        }
      }
    }
    
    console.log(`Admin ${session.user.email} created refill order for original order ${id}`, {
      originalOrderId: id,
      refillOrderId: result.id,
      refillType,
      refillQuantity,
      refillPrice,
      reason: reason || 'No reason provided',
      providerForwarded: !!providerForwardResult,
      providerError: providerError || null,
      timestamp: new Date().toISOString()
    });
    
    // Fetch updated refill order with provider data if forwarded
    let updatedRefillOrder = result;
    if (providerForwardResult) {
      updatedRefillOrder = await db.newOrders.findUnique({
        where: { id: result.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              currency: true
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
      }) || result;
    }
    
    return NextResponse.json({
      success: true,
      message: providerForwardResult 
        ? `Refill order created successfully and forwarded to provider`
        : providerError
        ? `Refill order created, but provider forwarding failed: ${providerError}`
        : `Refill order created successfully`,
      data: {
        originalOrder: {
          id: originalOrder.id,
          status: originalOrder.status,
          qty: Number(originalOrder.qty),
          remains: Number(originalOrder.remains)
        },
        refillOrder: updatedRefillOrder,
        refillDetails: {
          type: refillType,
          quantity: refillQuantity,
          cost: refillPrice,
          reason: reason || 'Admin initiated refill'
        },
        providerForward: providerForwardResult || null,
        providerError: providerError || null
      },
      error: null
    });
    
  } catch (error) {
    console.error('Error creating refill order:', error);
    return NextResponse.json(
      {
        error: 'Failed to create refill order: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Order ID is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    const order = await db.newOrders.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            balance: true,
            currency: true,
            dollarRate: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true,
            min_order: true,
            max_order: true,
            status: true
          }
        }
      }
    });
    
    if (!order) {
      return NextResponse.json(
        { 
          error: 'Order not found',
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }
    
    const eligibleStatuses = ['completed', 'partial'];
    const isEligible = eligibleStatuses.includes(order.status) && (order as any).service?.status === 'active';
    
    const { currencies } = await fetchCurrencyData();
    
    const refillRate = (order as any).service?.rate || 0;
    const fullRefillUsd = (refillRate * Number(order.qty)) / 1000;
    const remainingRefillUsd = (refillRate * Number(order.remains)) / 1000;
    
    const userCurrency = order.user.currency || 'USD';
    const fullRefillInUserCurrency = userCurrency === 'USD' || userCurrency === 'USDT' 
      ? fullRefillUsd 
      : convertFromUSD(fullRefillUsd, userCurrency, currencies);
    const remainingRefillInUserCurrency = userCurrency === 'USD' || userCurrency === 'USDT' 
      ? remainingRefillUsd 
      : convertFromUSD(remainingRefillUsd, userCurrency, currencies);
    
    const refillInfo = {
      eligible: isEligible,
      reason: !isEligible ? (
        !eligibleStatuses.includes(order.status) 
          ? `Order status must be completed or partial (current: ${order.status})`
          : 'Service is not active'
      ) : null,
      order: {
        id: order.id,
        status: order.status,
        totalQuantity: Number(order.qty),
        remainingQuantity: Number(order.remains),
        deliveredQuantity: Number(order.qty) - Number(order.remains)
      },
      service: {
        id: (order as any).service?.id,
        name: (order as any).service?.name,
        rate: (order as any).service?.rate,
        status: (order as any).service?.status,
        minOrder: (order as any).service?.min_order,
        maxOrder: (order as any).service?.max_order
      },
      user: {
        balance: order.user.balance,
        currency: order.user.currency
      },
      refillOptions: {
        full: {
          quantity: Number(order.qty),
          costUsd: fullRefillUsd,
          cost: fullRefillInUserCurrency,
          affordable: order.user.balance >= fullRefillInUserCurrency
        },
        remaining: {
          quantity: Number(order.remains),
          costUsd: remainingRefillUsd,
          cost: remainingRefillInUserCurrency,
          affordable: order.user.balance >= remainingRefillInUserCurrency
        }
      }
    };
    
    return NextResponse.json({
      success: true,
      data: refillInfo,
      error: null
    });
    
  } catch (error) {
    console.error('Error fetching refill info:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch refill info: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
