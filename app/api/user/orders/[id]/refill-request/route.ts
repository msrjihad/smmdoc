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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string   }> }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Please login.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const { id  } = await params;
    const body = await req.json();
    const { reason } = body;

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
      where: { id: parseInt(id) },
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

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { 
          error: 'You can only request refill for your own orders',
          success: false,
          data: null 
        },
        { status: 403 }
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

    if (!['completed', 'partial'].includes(order.status)) {
      return NextResponse.json(
        { 
          error: 'Only completed or partial orders are eligible for refill',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const completionTime = new Date(order.updatedAt).getTime();
    const currentTime = new Date().getTime();

    const refillDays = order.service.refillDays || 30;
    const daysDifference = Math.floor((currentTime - completionTime) / (1000 * 60 * 60 * 24));

    if (refillDays && daysDifference > refillDays) {
      return NextResponse.json(
        { 
          error: `Refill period has expired. Refill is only available for ${refillDays} days after order completion.`,
          success: false,
          data: null 
        },
        { status: 400 }
      );
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
        console.error(`Error checking provider refill eligibility for order ${id}:`, error);
      }
    }

    const existingRequest = await db.refillRequests.findFirst({
      where: {
        orderId: parseInt(id),
        status: 'pending'
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { 
          error: 'A refill request for this order is already pending',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const refillRequest = await db.refillRequests.create({
      data: {
        orderId: parseInt(id),
        userId: session.user.id,
        reason: reason || 'Customer requested refill due to drop in count',
        status: 'pending',
      }
    });

    try {
      const { sendAdminNewRefillRequestNotification } = await import('@/lib/notifications/admin-notifications');
      const user = await db.users.findUnique({
        where: { id: session.user.id },
        select: { username: true, name: true }
      });
      await sendAdminNewRefillRequestNotification(
        parseInt(id),
        user?.username || user?.name || 'User'
      );
    } catch (notificationError) {
      console.error('Error sending admin new refill request notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: {
        refillRequest,
        message: 'Refill request submitted successfully. Our team will review it within 24 hours.'
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
