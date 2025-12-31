import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ApiRequestBuilder, createApiSpecFromProvider } from '@/lib/provider-api-specification';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Please login.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, reason } = body;

    if (!orderId || !reason) {
      return NextResponse.json(
        {
          error: 'Order ID and reason are required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const order = await db.newOrders.findUnique({
      where: { id: parseInt(orderId) },
      select: {
        id: true,
        userId: true,
        status: true,
        updatedAt: true,
        providerOrderId: true,
        service: {
          select: {
            id: true,
            name: true,
            refill: true,
            refillDays: true,
            providerId: true,
            providerServiceId: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
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

    if (order.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        {
          error: 'You can only request refill for your own orders',
          success: false,
          data: null
        },
        { status: 403 }
      );
    }

    if (order.status !== 'completed') {
      return NextResponse.json(
        {
          error: 'Only completed orders can be refilled',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (!order.service.refill) {
      return NextResponse.json(
        {
          error: 'This service does not support refill',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingRequest = await db.refillRequests.findFirst({
      where: {
        orderId: parseInt(orderId),
        status: {
          in: ['pending', 'approved']
        }
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'A refill request already exists for this order',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    // Check if 24 hours have passed since order completion
    const completionTime = new Date(order.updatedAt).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceCompletion = (currentTime - completionTime) / (1000 * 60 * 60);
    
    if (hoursSinceCompletion < 24) {
      return NextResponse.json(
        {
          error: 'The refill request will be eligible after 24 hours of order completion',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (order.service.refillDays) {
      const daysSinceCompletion = Math.floor(
        (currentTime - completionTime) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceCompletion > order.service.refillDays) {
        return NextResponse.json(
          {
            error: `Refill requests must be made within ${order.service.refillDays} days of order completion`,
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }

    const refillRequest = await db.refillRequests.create({
      data: {
        orderId: parseInt(orderId),
        userId: parseInt(session.user.id),
        reason: reason.trim(),
        status: 'pending'
      },
      include: {
        order: {
          include: {
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    let providerRefillSubmitted = false;
    let providerRefillError: string | null = null;

    if (order.service.providerId && order.providerOrderId) {
      try {
        const provider = await db.apiProviders.findUnique({
          where: { id: order.service.providerId }
        });

        if (provider && provider.status === 'active') {
          const providerOrderId = order.providerOrderId;
          
          if (providerOrderId) {
            const apiSpec = createApiSpecFromProvider(provider);
            const requestBuilder = new ApiRequestBuilder(
              apiSpec,
              provider.api_url,
              provider.api_key,
              (provider as any).http_method || (provider as any).httpMethod || 'POST'
            );

            const refillRequestConfig = requestBuilder.buildRefillRequest(String(providerOrderId));

            console.log('Submitting refill request to provider:', {
              providerId: provider.id,
              providerName: provider.name,
              providerOrderId: providerOrderId,
              orderId: order.id,
              refillRequestId: refillRequest.id
            });

            const providerResponse = await fetch(refillRequestConfig.url, {
              method: refillRequestConfig.method,
              headers: refillRequestConfig.headers || {},
              body: refillRequestConfig.data,
              signal: AbortSignal.timeout((apiSpec.timeoutSeconds || 30) * 1000)
            });

            if (providerResponse.ok) {
              const providerResult = await providerResponse.json();
              
              if (providerResult.error) {
                providerRefillError = `Provider error: ${providerResult.error}`;
                console.error('Provider refill error:', providerRefillError);
              } else {
                providerRefillSubmitted = true;
                console.log('Refill request submitted to provider successfully:', providerResult);
              }
            } else {
              providerRefillError = `Provider API error: ${providerResponse.status} ${providerResponse.statusText}`;
              console.error('Provider refill API error:', providerRefillError);
            }
          }
        }
      } catch (error) {
        providerRefillError = error instanceof Error ? error.message : 'Unknown error submitting to provider';
        console.error('Error submitting refill request to provider:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...refillRequest,
        providerRefillSubmitted,
        providerRefillError: providerRefillError || null
      },
      message: providerRefillSubmitted 
        ? 'Refill request submitted successfully and forwarded to provider'
        : providerRefillError
        ? `Refill request stored, but provider submission failed: ${providerRefillError}`
        : 'Refill request submitted successfully',
      error: null
    });

  } catch (error) {
    console.error('Error creating refill request:', error);
    return NextResponse.json(
      {
        error: 'Failed to create refill request',
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Please login.',
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

    const whereClause: any = {
      userId: parseInt(session.user.id)
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    const totalRequests = await db.refillRequests.count({
      where: whereClause
    });

    const refillRequests = await db.refillRequests.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            service: {
              select: {
                id: true,
                name: true
              }
            },
            category: {
              select: {
                id: true,
                category_name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalPages = Math.ceil(totalRequests / limit);

    return NextResponse.json({
      success: true,
      data: refillRequests,
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
        error: 'Failed to fetch refill requests',
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
