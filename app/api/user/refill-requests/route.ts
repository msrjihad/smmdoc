import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ApiRequestBuilder, ApiResponseParser, createApiSpecFromProvider } from '@/lib/provider-api-specification';

async function checkProviderRefillEligibility(
  provider: any,
  providerOrderId: string
): Promise<{ eligible: boolean; reason?: string }> {
  try {
    const apiSpec = createApiSpecFromProvider(provider);
    const requestBuilder = new ApiRequestBuilder(
      apiSpec,
      provider.api_url,
      provider.api_key,
      (provider as any).http_method || (provider as any).httpMethod || 'POST'
    );

    const statusRequest = requestBuilder.buildOrderStatusRequest(providerOrderId);

    const response = await fetch(statusRequest.url, {
      method: statusRequest.method,
      headers: statusRequest.headers || {},
      body: statusRequest.data,
      signal: AbortSignal.timeout((apiSpec.timeoutSeconds || 30) * 1000)
    });

    if (!response.ok) {
      console.warn(`Provider API error when checking refill eligibility: ${response.status}`);
      return { eligible: true };
    }

    const result = await response.json();

    if (result.error) {
      console.warn(`Provider error when checking refill eligibility: ${result.error}`);
      return { eligible: true };
    }

    const responseParser = new ApiResponseParser(apiSpec);
    const parsedStatus = responseParser.parseOrderStatusResponse(result);

    const eligibleStatuses = ['completed', 'partial'];
    if (!eligibleStatuses.includes(parsedStatus.status?.toLowerCase())) {
      return {
        eligible: false,
        reason: `Order status from provider is "${parsedStatus.status}", which is not eligible for refill. Only completed or partial orders can be refilled.`
      };
    }

    const refillAvailable = 
      result.refill_available !== undefined ? result.refill_available :
      result.refillAvailable !== undefined ? result.refillAvailable :
      result.can_refill !== undefined ? result.can_refill :
      result.canRefill !== undefined ? result.canRefill :
      null;

    if (refillAvailable === false || refillAvailable === 0 || refillAvailable === '0' || refillAvailable === 'false') {
      return {
        eligible: false,
        reason: 'Provider indicates this order is not eligible for refill at this time.'
      };
    }

    return { eligible: true };

  } catch (error) {
    console.error('Error checking provider refill eligibility:', error);
    return { eligible: true };
  }
}

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

    const completionTime = new Date(order.updatedAt).getTime();
    const currentTime = new Date().getTime();

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

    if (order.service.providerId && order.providerOrderId) {
      try {
        const provider = await db.apiProviders.findUnique({
          where: { id: order.service.providerId }
        });

        if (provider && provider.status === 'active') {
          const providerEligibility = await checkProviderRefillEligibility(
            provider,
            order.providerOrderId
          );

          if (!providerEligibility.eligible) {
            return NextResponse.json(
              {
                error: providerEligibility.reason || 'Provider indicates this order is not eligible for refill',
                success: false,
                data: null
              },
              { status: 400 }
            );
          }
        }
      } catch (error) {
        console.error(`Error checking provider refill eligibility for order ${orderId}:`, error);
      }
    }

    const refillRequest = await db.refillRequests.create({
      data: {
        orderId: parseInt(orderId),
        userId: parseInt(session.user.id),
        reason: reason.trim(),
        status: 'pending'
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

            try {
              const providerResponse = await fetch(refillRequestConfig.url, {
                method: refillRequestConfig.method,
                headers: refillRequestConfig.headers || {},
                body: refillRequestConfig.data,
                signal: AbortSignal.timeout((apiSpec.timeoutSeconds || 30) * 1000)
              });

              if (providerResponse.ok) {
                let providerResult;
                try {
                  const contentType = providerResponse.headers.get('content-type');
                  if (contentType && contentType.includes('application/json')) {
                    providerResult = await providerResponse.json();
                  } else {
                    const textResult = await providerResponse.text();
                    providerResult = textResult ? { message: textResult } : {};
                  }
                } catch (parseError) {
                  console.error('Error parsing provider response:', parseError);
                  providerResult = {};
                }
                
                if (providerResult.error) {
                  providerRefillError = `Provider error: ${providerResult.error}`;
                  console.error('Provider refill error:', providerRefillError);
                } else {
                  providerRefillSubmitted = true;
                  console.log('Refill request submitted to provider successfully:', providerResult);
                }
              } else {
                const errorText = await providerResponse.text();
                let errorMessage = `Provider API error: ${providerResponse.status} ${providerResponse.statusText}`;
                try {
                  const errorJson = JSON.parse(errorText);
                  errorMessage = errorJson.error || errorJson.message || errorMessage;
                } catch {
                  if (errorText) {
                    errorMessage = errorText.length > 200 ? errorText.substring(0, 200) : errorText;
                  }
                }
                providerRefillError = errorMessage;
                console.error('Provider refill API error:', providerRefillError);
              }
            } catch (fetchError) {
              if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                providerRefillError = 'Provider request timed out';
              } else {
                providerRefillError = fetchError instanceof Error ? fetchError.message : 'Unknown error submitting to provider';
              }
              console.error('Error submitting refill request to provider:', fetchError);
            }
          }
        }
      } catch (error) {
        providerRefillError = error instanceof Error ? error.message : 'Unknown error submitting to provider';
        console.error('Error submitting refill request to provider:', error);
      }
    }

    // Serialize the refill request to avoid BigInt/Date serialization issues
    const serializedRefillRequest = {
      id: Number(refillRequest.id),
      orderId: Number(refillRequest.orderId),
      userId: Number(refillRequest.userId),
      reason: refillRequest.reason,
      status: refillRequest.status,
      createdAt: refillRequest.createdAt instanceof Date ? refillRequest.createdAt.toISOString() : refillRequest.createdAt,
      updatedAt: refillRequest.updatedAt instanceof Date ? refillRequest.updatedAt.toISOString() : refillRequest.updatedAt,
      processedBy: refillRequest.processedBy ? Number(refillRequest.processedBy) : null,
      processedAt: refillRequest.processedAt instanceof Date ? refillRequest.processedAt.toISOString() : refillRequest.processedAt,
      adminNotes: refillRequest.adminNotes
    };

    return NextResponse.json({
      success: true,
      data: {
        ...serializedRefillRequest,
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
