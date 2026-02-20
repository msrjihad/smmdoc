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
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value instanceof Date) {
          converted[key] = value.toISOString();
        } else {
          converted[key] = convertBigIntToNumber(value);
        }
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
    const orderStatus = searchParams.get('orderStatus') || 'all';
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
        take: limit,
        include: {
          order: {
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
              categoryId: true,
              providerOrderId: true,
            },
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  rate: true,
                  refill: true,
                  providerId: true,
                  providerName: true,
                  mode: true,
                }
              },
              category: {
                select: {
                  id: true,
                  category_name: true,
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              currency: true,
            }
          },
          user_refillrequest_processedByTouser: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      refillRequests = refillRequests.map((request: any) => {
        const order = request.order;
        if (orderStatus !== 'all' && order?.status !== orderStatus) {
          request.order = null;
        }
        if (request.user_refillrequest_processedByTouser) {
          request.processedByUser = request.user_refillrequest_processedByTouser;
          delete request.user_refillrequest_processedByTouser;
        }
        return request;
      });
    } catch (error) {
      console.error('Error fetching refill requests:', error);
      refillRequests = [];
    }

    let filteredRequests = refillRequests;
    if (orderStatus !== 'all') {
      filteredRequests = refillRequests.filter((request: any) => request.order && request.order.status === orderStatus);
    } else {
      filteredRequests = refillRequests.filter((request: any) => request.order);
    }
    
    const uniqueRefillRequests = filteredRequests.filter((request, index, self) =>
      index === self.findIndex(r => r.orderId === request.orderId)
    );

    const totalPages = Math.ceil(totalRequests / limit);

    const serializedData = convertBigIntToNumber(uniqueRefillRequests);
    
    const finalData = serializedData
      .filter((request: any) => request != null)
      .map((request: any) => {
        if (!request) return request;
        
        try {
          if (request.createdAt !== null && request.createdAt !== undefined) {
            if (request.createdAt instanceof Date) {
              request.createdAt = request.createdAt.toISOString();
            } else if (typeof request.createdAt === 'string') {
              request.createdAt = request.createdAt;
            } else {
              try {
                const date = new Date(request.createdAt);
                if (!isNaN(date.getTime())) {
                  request.createdAt = date.toISOString();
                }
              } catch (e) {
                console.warn(`Could not convert createdAt for refill request ${request?.id}`);
              }
            }
          }
          if (request.updatedAt !== null && request.updatedAt !== undefined) {
            if (request.updatedAt instanceof Date) {
              request.updatedAt = request.updatedAt.toISOString();
            } else if (typeof request.updatedAt === 'string') {
              request.updatedAt = request.updatedAt;
            } else {
              try {
                const date = new Date(request.updatedAt);
                if (!isNaN(date.getTime())) {
                  request.updatedAt = date.toISOString();
                }
              } catch (e) {
                console.warn(`Could not convert updatedAt for refill request ${request?.id}`);
              }
            }
          }
        } catch (error) {
          console.warn(`Error serializing dates for refill request ${request?.id}:`, error);
        }
        return request;
      })
      .filter((request: any) => request != null);

    return NextResponse.json({
      success: true,
      data: finalData,
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
