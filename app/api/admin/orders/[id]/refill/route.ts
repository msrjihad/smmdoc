import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { convertFromUSD, fetchCurrencyData } from '@/lib/currency-utils';

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
            status: true
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
          startCount: BigInt(0)
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
    
    console.log(`Admin ${session.user.email} created refill order for original order ${id}`, {
      originalOrderId: id,
      refillOrderId: result.id,
      refillType,
      refillQuantity,
      refillPrice,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: `Refill order created successfully`,
      data: {
        originalOrder: {
          id: originalOrder.id,
          status: originalOrder.status,
          qty: Number(originalOrder.qty),
          remains: Number(originalOrder.remains)
        },
        refillOrder: result,
        refillDetails: {
          type: refillType,
          quantity: refillQuantity,
          cost: refillPrice,
          reason: reason || 'Admin initiated refill'
        }
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
