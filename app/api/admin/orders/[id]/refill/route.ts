import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { convertFromUSD, fetchCurrencyData } from '@/lib/currency-utils';
import { ProviderOrderForwarder } from '@/lib/utils/provider-order-forwarder';

function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertBigIntToNumber(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
}

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

    let providerRefillResult = null;
    let providerError = null;

    if (originalOrder.service.providerId && originalOrder.providerOrderId) {
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

          console.log('Forwarding refill request to provider:', {
            providerId: provider.id,
            providerName: provider.name,
            originalOrderId: originalOrder.id,
            originalProviderOrderId: originalOrder.providerOrderId,
            refillOrderId: result.id
          });

          const refillResult = await forwarder.forwardRefillOrderToProvider(
            providerForApi,
            originalOrder.providerOrderId
          );

          console.log('Refill request forwarded to provider:', {
            refillOrderId: result.id,
            providerRefillId: refillResult.refill,
            status: refillResult.status,
            error: refillResult.error
          });

          if (refillResult.error) {
            providerError = refillResult.error;
            console.error('Provider refill request failed:', providerError);
            
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
          } else if (refillResult.refill && refillResult.refill !== '') {
            providerRefillResult = {
              providerRefillId: refillResult.refill,
              status: refillResult.status || 'pending'
            };

            await db.newOrders.update({
              where: { id: result.id },
              data: {
                providerOrderId: refillResult.refill,
                providerStatus: 'processing',
                status: 'processing',
                lastSyncAt: new Date(),
                updatedAt: new Date()
              }
            });

            await db.providerOrderLogs.create({
              data: {
                orderId: result.id,
                providerId: originalOrder.service.providerId,
                action: 'forward_refill_order',
                status: 'success',
                response: JSON.stringify({
                  providerRefillId: refillResult.refill,
                  status: refillResult.status
                }),
                createdAt: new Date()
              }
            });

            console.log('Refill order updated with provider refill ID:', {
              refillOrderId: result.id,
              providerRefillId: refillResult.refill,
              status: refillResult.status
            });
          } else {
            providerRefillResult = {
              providerRefillId: '',
              status: refillResult.status || 'pending'
            };

            await db.newOrders.update({
              where: { id: result.id },
              data: {
                providerStatus: 'processing',
                status: 'processing',
                lastSyncAt: new Date(),
                updatedAt: new Date()
              }
            });

            await db.providerOrderLogs.create({
              data: {
                orderId: result.id,
                providerId: originalOrder.service.providerId,
                action: 'forward_refill_order',
                status: 'success',
                response: JSON.stringify({
                  status: refillResult.status,
                  note: 'No refill ID returned, status set to processing'
                }),
                createdAt: new Date()
              }
            });
          }
        }
      } catch (error) {
        providerError = error instanceof Error ? error.message : 'Unknown error forwarding to provider';
        console.error('Error forwarding refill request to provider:', error);
        
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
      providerRefillForwarded: !!providerRefillResult,
      providerError: providerError || null,
      timestamp: new Date().toISOString()
    });
    
    let updatedRefillOrder = result;
    if (providerRefillResult) {
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
      message: providerRefillResult 
        ? `Refill order created successfully and forwarded to provider`
        : providerError
        ? `Refill order created, but provider forwarding failed: ${providerError}`
        : `Refill order created successfully`,
      data: {
        originalOrder: {
          id: originalOrder.id,
          status: originalOrder.status,
          qty: Number(originalOrder.qty),
          remains: Number(originalOrder.remains),
          providerOrderId: originalOrder.providerOrderId
        },
        refillOrder: updatedRefillOrder,
        refillDetails: {
          type: refillType,
          quantity: refillQuantity,
          cost: refillPrice,
          reason: reason || 'Admin initiated refill'
        },
        providerRefill: providerRefillResult || null,
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
    
    const refillRate = Number((order as any).service?.rate || 0);
    const orderQty = Number(order.qty);
    const orderRemains = Number(order.remains);
    const fullRefillUsd = (refillRate * orderQty) / 1000;
    const remainingRefillUsd = (refillRate * orderRemains) / 1000;
    
    const userCurrency = order.user.currency || 'USD';
    const userBalance = Number(order.user.balance);
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
        totalQuantity: orderQty,
        remainingQuantity: orderRemains,
        deliveredQuantity: orderQty - orderRemains
      },
      service: {
        id: (order as any).service?.id,
        name: (order as any).service?.name,
        rate: refillRate,
        status: (order as any).service?.status,
        minOrder: Number((order as any).service?.min_order || 0),
        maxOrder: Number((order as any).service?.max_order || 0)
      },
      user: {
        balance: userBalance,
        currency: order.user.currency
      },
      refillOptions: {
        full: {
          quantity: orderQty,
          costUsd: fullRefillUsd,
          cost: fullRefillInUserCurrency,
          affordable: userBalance >= fullRefillInUserCurrency
        },
        remaining: {
          quantity: orderRemains,
          costUsd: remainingRefillUsd,
          cost: remainingRefillInUserCurrency,
          affordable: userBalance >= remainingRefillInUserCurrency
        }
      }
    };
    
    const serializedData = convertBigIntToNumber(refillInfo);
    
    return NextResponse.json({
      success: true,
      data: serializedData,
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
