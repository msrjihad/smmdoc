import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ApiRequestBuilder, createApiSpecFromProvider } from '@/lib/provider-api-specification';

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

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { 
          error: 'Please provide a detailed reason (minimum 10 characters)',
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
        createdAt: true,
        price: true,
        providerOrderId: true,
        service: {
          select: {
            id: true,
            name: true,
            cancel: true,
            providerId: true,
            providerServiceId: true
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

    if (order.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { 
          error: 'You can only request cancellation for your own orders',
          success: false,
          data: null 
        },
        { status: 403 }
      );
    }

    if (!order.service.cancel) {
      return NextResponse.json(
        { 
          error: 'This service does not support cancellation',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    if (!['pending', 'processing', 'in_progress'].includes(order.status)) {
      return NextResponse.json(
        { 
          error: 'Only pending or processing orders can be cancelled',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const existingRequest = await db.cancelRequests.findFirst({
      where: {
        orderId: parseInt(id)
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

    const refundAmount = order.price;

    console.log('Creating or updating cancel request:', {
      orderId: parseInt(id),
      userId: parseInt(session.user.id),
      reasonLength: reason.trim().length,
      refundAmount,
      existingRequestId: existingRequest?.id
    });

    let cancelRequest;
    
    if (existingRequest && (existingRequest.status === 'failed' || existingRequest.status === 'declined')) {
      cancelRequest = await db.cancelRequests.update({
        where: { id: existingRequest.id },
        data: {
          reason: reason.trim(),
          status: 'pending',
          refundAmount: refundAmount,
          adminNotes: null,
          processedBy: null,
          processedAt: null,
          updatedAt: new Date()
        }
      });
    } else {
      cancelRequest = await db.cancelRequests.create({
        data: {
          orderId: parseInt(id),
          userId: parseInt(session.user.id),
          reason: reason.trim(),
          status: 'pending',
          refundAmount: refundAmount,
        }
      });
    }

    try {
      const { sendAdminNewManualCancelRequestNotification } = await import('@/lib/notifications/admin-notifications');
      await sendAdminNewManualCancelRequestNotification(
        cancelRequest.id,
        parseInt(id),
        order.user.name || order.user.email || 'User'
      );
    } catch (notificationError) {
      console.error('Error sending admin new manual cancel request notification:', notificationError);
    }

    console.log('Cancel request created successfully:', {
      id: cancelRequest.id,
      orderId: cancelRequest.orderId,
      userId: cancelRequest.userId,
      status: cancelRequest.status
    });

    let providerCancelSubmitted = false;
    let providerCancelError: string | null = null;
    let shouldMarkAsFailed = false;

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

            const cancelRequestConfig = requestBuilder.buildCancelRequest([String(providerOrderId)]);

            console.log('Submitting cancel request to provider:', {
              providerId: provider.id,
              providerName: provider.name,
              providerOrderId: providerOrderId,
              orderId: order.id,
              cancelRequestId: cancelRequest.id
            });

            const providerResponse = await fetch(cancelRequestConfig.url, {
              method: cancelRequestConfig.method,
              headers: cancelRequestConfig.headers || {},
              body: cancelRequestConfig.data,
              signal: AbortSignal.timeout((apiSpec.timeoutSeconds || 30) * 1000)
            });

            if (providerResponse.ok) {
              const providerResult = await providerResponse.json();
              
              if (providerResult.error) {
                providerCancelError = `Provider error: ${providerResult.error}`;
                shouldMarkAsFailed = true;
                console.error('Provider cancel error:', providerCancelError);
              } else {
                providerCancelSubmitted = true;
                console.log('Cancel request submitted to provider successfully:', providerResult);
              }
            } else {
              providerCancelError = `Provider API error: ${providerResponse.status} ${providerResponse.statusText}`;
              shouldMarkAsFailed = true;
              console.error('Provider cancel API error:', providerCancelError);
            }
          }
        }
      } catch (error) {
        providerCancelError = error instanceof Error ? error.message : 'Unknown error submitting to provider';
        shouldMarkAsFailed = true;
        console.error('Error submitting cancel request to provider:', error);
      }
    }

    if (shouldMarkAsFailed) {
      await db.cancelRequests.update({
        where: { id: cancelRequest.id },
        data: { 
          status: 'failed',
          adminNotes: `Provider submission failed: ${providerCancelError}`,
          updatedAt: new Date()
        }
      });
      cancelRequest.status = 'failed';
    }

    return NextResponse.json({
      success: true,
      data: {
        cancelRequest,
        estimatedRefund: refundAmount,
        providerCancelSubmitted,
        providerCancelError: providerCancelError || null
      },
      message: providerCancelSubmitted 
        ? 'Cancel request submitted successfully and forwarded to provider'
        : providerCancelError
        ? `Cancel request stored, but provider submission failed: ${providerCancelError}`
        : 'Cancellation request submitted successfully. Our team will review it within 24 hours.',
      error: null
    });

  } catch (error) {
    console.error('Error creating cancel request:', error);
    return NextResponse.json(
      {
        error: 'Failed to create cancel request: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
