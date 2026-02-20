import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createApiSpecFromProvider, ApiRequestBuilder } from '@/lib/provider-api-specification';

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
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        {
          error: 'Invalid Order ID format',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const order = await db.newOrders.findUnique({
      where: { id: orderId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            providerId: true,
            providerServiceId: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
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

    const orderStatus = order.status?.toLowerCase();
    if (['cancelled', 'canceled'].includes(orderStatus)) {
      return NextResponse.json(
        {
          error: 'This order has already been cancelled',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Only pending orders can be cancelled',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingRequest = await db.cancelRequests.findFirst({
      where: {
        orderId: orderId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          {
            error: 'A cancellation request for this order is already pending',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
      
      if (existingRequest.status === 'approved') {
        return NextResponse.json(
          {
            error: 'This order has already been cancelled',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
      
    }

    if (!order.providerOrderId) {
      return NextResponse.json(
        {
          error: 'This order has not been forwarded to a provider yet',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (!order.service.providerId) {
      return NextResponse.json(
        {
          error: 'This order does not have an associated provider',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const provider = await db.apiProviders.findUnique({
      where: { id: order.service.providerId }
    });

    if (!provider) {
      return NextResponse.json(
        {
          error: 'Provider not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    if (provider.status !== 'active') {
      return NextResponse.json(
        {
          error: 'Provider is not active',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const apiSpec = createApiSpecFromProvider(provider);
    const requestBuilder = new ApiRequestBuilder(
      apiSpec,
      provider.api_url,
      provider.api_key,
      (provider as any).http_method || (provider as any).httpMethod || 'POST'
    );

    const cancelRequestConfig = requestBuilder.buildCancelRequest([String(order.providerOrderId)]);

    console.log('Requesting cancel order from provider:', {
      orderId: order.id,
      providerId: provider.id,
      providerName: provider.name,
      providerOrderId: order.providerOrderId,
      adminId: session.user.id,
      adminEmail: session.user.email
    });

    let providerResponse;
    let providerResult;
    let providerError: string | null = null;

    try {
      const fetchOptions: RequestInit = {
        method: cancelRequestConfig.method,
        headers: cancelRequestConfig.headers || {},
        signal: AbortSignal.timeout((apiSpec.timeoutSeconds || 30) * 1000)
      };

      if (cancelRequestConfig.data && cancelRequestConfig.method !== 'GET') {
        fetchOptions.body = cancelRequestConfig.data;
      }

      const response = await fetch(cancelRequestConfig.url, fetchOptions);

      providerResponse = response;

      if (response.ok) {
        try {
          providerResult = await response.json();
          
          if (providerResult.error) {
            providerError = `Provider error: ${providerResult.error}`;
            console.error('Provider cancel error:', providerError);
          } else {
            console.log('Cancel request submitted to provider successfully:', providerResult);
          }
        } catch (jsonError) {
          const textResponse = await response.text();
          console.log('Provider cancel response (non-JSON):', textResponse);
          providerResult = { message: textResponse };
        }
      } else {
        providerError = `Provider API error: ${response.status} ${response.statusText}`;
        console.error('Provider cancel API error:', providerError);
      }
    } catch (error) {
      providerError = error instanceof Error ? error.message : 'Unknown error submitting to provider';
      console.error('Error submitting cancel request to provider:', error);
    }

    const refundAmount = order.price || 0;
    const finalStatus = providerError ? 'failed' : 'pending';
    const adminReason = `Admin requested cancellation (Admin: ${session.user.email || session.user.id})`;
    const adminNotes = providerError 
      ? `Provider cancellation failed: ${providerError}` 
      : `Cancel request forwarded to provider by admin ${session.user.email || session.user.id}`;

    let cancelRequest;
    
    if (existingRequest && (existingRequest.status === 'failed' || existingRequest.status === 'declined')) {
      cancelRequest = await db.cancelRequests.update({
        where: { id: existingRequest.id },
        data: {
          reason: adminReason,
          status: finalStatus,
          refundAmount: refundAmount,
          adminNotes: adminNotes,
          processedBy: parseInt(session.user.id),
          processedAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      cancelRequest = await db.cancelRequests.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          reason: adminReason,
          status: finalStatus,
          refundAmount: refundAmount,
          adminNotes: adminNotes,
          processedBy: parseInt(session.user.id),
          processedAt: new Date()
        }
      });
    }

    await db.providerOrderLogs.create({
      data: {
        orderId: order.id,
        providerId: provider.id,
        action: 'request_cancel',
        status: providerError ? 'error' : 'success',
        response: JSON.stringify(providerResult || { error: providerError }),
        createdAt: new Date()
      }
    });

    if (providerError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to request cancellation from provider: ${providerError}. Cancel request has been saved with 'failed' status.`,
          data: {
            cancelRequestId: cancelRequest.id,
            status: 'failed'
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cancel request sent to provider successfully and saved. If the provider cancels the order, the user balance will be automatically refunded.',
      data: {
        cancelRequestId: cancelRequest.id,
        orderId: order.id,
        providerOrderId: order.providerOrderId,
        providerName: provider.name,
        providerResponse: providerResult,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error requesting cancel order:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error',
        data: null
      },
      { status: 500 }
    );
  }
}

