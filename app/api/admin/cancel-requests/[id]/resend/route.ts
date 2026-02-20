import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ApiRequestBuilder, createApiSpecFromProvider } from '@/lib/provider-api-specification';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      return NextResponse.json(
        { error: 'Admin or Moderator access required', success: false },
        { status: 403 }
      );
    }

    const { id } = await params;
    const requestId = parseInt(id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID', success: false },
        { status: 400 }
      );
    }

    const cancelRequest = await db.cancelRequests.findUnique({
      where: { id: requestId },
      include: {
        order: {
          include: {
            service: true
          }
        }
      }
    });

    if (!cancelRequest) {
      return NextResponse.json(
        { error: 'Cancel request not found', success: false },
        { status: 404 }
      );
    }

    if (!cancelRequest.order) {
      return NextResponse.json(
        { error: 'Order not found for this cancel request', success: false },
        { status: 404 }
      );
    }

    if (!cancelRequest.order.service) {
      return NextResponse.json(
        { error: 'Service not found for this order', success: false },
        { status: 404 }
      );
    }

    if (cancelRequest.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed cancel requests can be resent', success: false },
        { status: 400 }
      );
    }

    if (!cancelRequest.order.service.providerId || !cancelRequest.order.providerOrderId) {
      return NextResponse.json(
        { error: 'This order does not have a provider service', success: false },
        { status: 400 }
      );
    }

    let providerCancelSubmitted = false;
    let providerCancelError: string | null = null;

    try {
      const provider = await db.apiProviders.findUnique({
        where: { id: cancelRequest.order.service.providerId }
      });

      if (!provider || provider.status !== 'active') {
        providerCancelError = 'Provider is not active or not found';
      } else {
        const providerOrderId = cancelRequest.order.providerOrderId;
        
        if (providerOrderId) {
          const apiSpec = createApiSpecFromProvider(provider);
          const requestBuilder = new ApiRequestBuilder(
            apiSpec,
            provider.api_url,
            provider.api_key,
            (provider as any).http_method || (provider as any).httpMethod || 'POST'
          );

          const cancelRequestConfig = requestBuilder.buildCancelRequest([String(providerOrderId)]);

          console.log('Resending cancel request to provider:', {
            providerId: provider.id,
            providerName: provider.name,
            providerOrderId: providerOrderId,
            orderId: cancelRequest.orderId,
            cancelRequestId: cancelRequest.id
          });

          const fetchOptions: RequestInit = {
            method: cancelRequestConfig.method,
            headers: cancelRequestConfig.headers || {},
            signal: AbortSignal.timeout((apiSpec.timeoutSeconds || 30) * 1000)
          };

          if (cancelRequestConfig.data && cancelRequestConfig.method !== 'GET') {
            fetchOptions.body = cancelRequestConfig.data;
          }

          const providerResponse = await fetch(cancelRequestConfig.url, fetchOptions);

          if (providerResponse.ok) {
            try {
              const providerResult = await providerResponse.json();
              
              if (providerResult.error) {
                providerCancelError = `Provider error: ${providerResult.error}`;
                console.error('Provider cancel error:', providerCancelError);
              } else {
                providerCancelSubmitted = true;
                console.log('Cancel request resent to provider successfully:', providerResult);
              }
            } catch (jsonError) {
              try {
                const textResponse = await providerResponse.text();
                console.log('Provider cancel response (non-JSON):', textResponse);
                providerCancelSubmitted = true;
              } catch (textError) {
                providerCancelError = 'Provider returned non-JSON response and could not read text';
                console.error('Error reading provider response:', textError);
              }
            }
          } else {
            providerCancelError = `Provider API error: ${providerResponse.status} ${providerResponse.statusText}`;
            console.error('Provider cancel API error:', providerCancelError);
          }
        } else {
          providerCancelError = 'Provider order ID is missing';
        }
      }
    } catch (error) {
      providerCancelError = error instanceof Error ? error.message : 'Unknown error submitting to provider';
      console.error('Error resending cancel request to provider:', error);
    }

    let updatedStatus = 'failed';
    let updatedNotes = cancelRequest.adminNotes || '';

    if (providerCancelSubmitted) {
      updatedStatus = 'pending';
      updatedNotes = updatedNotes ? `${updatedNotes}\n\nResent successfully at ${new Date().toISOString()}` : `Resent successfully at ${new Date().toISOString()}`;
    } else {
      updatedNotes = updatedNotes 
        ? `${updatedNotes}\n\nResend failed: ${providerCancelError}`
        : `Resend failed: ${providerCancelError}`;
    }

    const updateData: any = {
      status: updatedStatus,
      adminNotes: updatedNotes,
      updatedAt: new Date()
    };

    const updatedRequest = await db.cancelRequests.update({
      where: { id: requestId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: providerCancelSubmitted 
        ? 'Cancel request resent to provider successfully'
        : `Failed to resend cancel request: ${providerCancelError}`,
      data: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        providerCancelSubmitted,
        providerCancelError: providerCancelError || null
      }
    });

  } catch (error) {
    console.error('Error resending cancel request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

