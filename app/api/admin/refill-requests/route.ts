import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const whereClause: any = {};

    if (status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { orderId: { equals: parseInt(search) || 0 } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const totalRequests = await db.refillRequests.count({
      where: whereClause,
    });

    let refillRequests: any[] = [];

    try {
      refillRequests = await db.refillRequests.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      });

      for (const request of refillRequests) {
        if (request.orderId) {
          try {
            const order = await db.newOrders.findUnique({
              where: { id: request.orderId },
              select: {
                id: true,
                qty: true,
                remains: true,
                price: true,
                usdPrice: true,
                link: true,
                status: true,
                createdAt: true,
                serviceId: true,
              }
            });

            if (order && order.serviceId) {
              try {
                const service = await db.services.findUnique({
                  where: { id: order.serviceId },
                  select: {
                    id: true,
                    name: true,
                    rate: true,
                    refill: true,
                    providerId: true,
                    providerName: true,
                    mode: true,
                  }
                });
                (order as any).service = service;
              } catch (error) {
                console.warn(`Service not found for order ${order.id}`);
                (order as any).service = null;
              }
            }

            (request as any).order = order;
          } catch (error) {
            console.warn(`Order not found for refill request ${request.id}`);
            (request as any).order = null;
          }
        }

        if (request.userId) {
          try {
            const user = await db.users.findUnique({
              where: { id: request.userId },
              select: {
                id: true,
                name: true,
                email: true,
                currency: true,
              }
            });
            (request as any).user = user;
          } catch (error) {
            console.warn(`User not found for refill request ${request.id}`);
            (request as any).user = null;
          }
        }

        if (request.processedBy) {
          try {
            const processedByUser = await db.users.findUnique({
              where: { id: request.processedBy },
              select: {
                id: true,
                name: true,
                email: true,
              }
            });
            (request as any).processedByUser = processedByUser;
          } catch (error) {
            console.warn(`Processed by user not found for refill request ${request.id}`);
            (request as any).processedByUser = null;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching refill requests:', error);
      refillRequests = [];
    }

    const uniqueRefillRequests = refillRequests.filter((request, index, self) =>
      index === self.findIndex(r => r.orderId === request.orderId)
    );

    const totalPages = Math.ceil(totalRequests / limit);

    const serializedData = convertBigIntToNumber(uniqueRefillRequests);

    return NextResponse.json({
      success: true,
      data: serializedData,
      pagination: {
        total: totalRequests,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching refill requests:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch refill requests: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, reason } = body;

    if (!orderId) {
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
      where: { id: parseInt(orderId) },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            refill: true,
            refillDays: true,
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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

    const refillRequest = await db.refillRequests.create({
      data: {
        orderId: parseInt(orderId),
        userId: order.userId,
        reason: reason || 'Admin created refill request',
        status: 'pending',
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        refillRequest,
        message: 'Refill request created successfully'
      },
      error: null
    });

  } catch (error) {
    console.error('Error creating refill request:', error);
    return NextResponse.json(
      {
        error: 'Failed to create refill request: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
