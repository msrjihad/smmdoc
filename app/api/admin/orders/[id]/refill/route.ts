import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { convertFromUSD, fetchCurrencyData } from '@/lib/currency-utils';

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
    const { quantity, startCount } = body;
    
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
    
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { 
          error: 'Refill quantity must be provided and greater than 0',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    if (!startCount || startCount < 0) {
      return NextResponse.json(
        { 
          error: 'Start count must be provided and greater than or equal to 0',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    const refillQuantity = parseInt(quantity);
    const refillStartCount = parseInt(startCount);
    
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
    
    // Find existing refill request for this order
    const existingRefillRequest = await db.refillRequests.findFirst({
      where: {
        orderId: originalOrder.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Update or create refill request with refill data
    const refillData = {
      startCount: refillStartCount,
      quantity: refillQuantity
    };
    
    let refillRequest;
    if (existingRefillRequest) {
      // Update existing refill request
      refillRequest = await db.refillRequests.update({
        where: { id: existingRefillRequest.id },
        data: {
          adminNotes: JSON.stringify(refillData),
          status: 'completed',
          processedBy: session.user.id,
          processedAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new refill request
      refillRequest = await db.refillRequests.create({
        data: {
          orderId: originalOrder.id,
          userId: originalOrder.userId,
          reason: 'Admin created refill',
          status: 'completed',
          adminNotes: JSON.stringify(refillData),
          processedBy: session.user.id,
          processedAt: new Date()
        }
      });
    }
    
    console.log(`Admin ${session.user.email} stored refill data for order ${id}`, {
      originalOrderId: id,
      refillRequestId: refillRequest.id,
      refillQuantity,
      refillStartCount,
      timestamp: new Date().toISOString()
    });
    
    const responseData = {
      success: true,
      message: 'Refill data stored successfully',
      data: {
        refillRequest: {
          id: refillRequest.id,
          orderId: refillRequest.orderId,
          status: refillRequest.status,
          startCount: refillStartCount,
          quantity: refillQuantity
        }
      },
      error: null
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error storing refill data:', error);
    return NextResponse.json(
      {
        error: 'Failed to store refill data: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
        deliveredQuantity: orderQty - orderRemains,
        startCount: Number(order.startCount)
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
