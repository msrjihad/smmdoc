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
          error: 'Refill request ID is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const refillRequest = await db.refillRequests.findUnique({
      where: { id: parseInt(id) },
      include: {
        order: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                providerId: true,
                providerName: true
              }
            }
          }
        }
      }
    });

    if (!refillRequest) {
      return NextResponse.json(
        { 
          error: 'Refill request not found',
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }

    const order = refillRequest.order;
    if (!order) {
      return NextResponse.json(
        { 
          error: 'Order not found for this refill request',
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }

    if (!order.service?.providerId || !order.providerOrderId) {
      return NextResponse.json(
        { 
          error: 'This order does not have a provider. Cannot resend to provider.',
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

    const refillRequestConfig = requestBuilder.buildRefillRequest(String(order.providerOrderId));

    console.log('Resending refill request to provider:', {
      providerId: provider.id,
      providerName: provider.name,
      providerOrderId: order.providerOrderId,
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
          return NextResponse.json({
            success: false,
            error: `Provider error: ${providerResult.error}`,
            data: null
          }, { status: 400 });
        } else {
          console.log('Refill request resent to provider successfully:', providerResult);
          return NextResponse.json({
            success: true,
            message: 'Refill request resent to provider successfully',
            data: {
              providerResponse: providerResult
            },
            error: null
          });
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
        
        return NextResponse.json({
          success: false,
          error: errorMessage,
          data: null
        }, { status: 400 });
      }
    } catch (fetchError) {
      let errorMessage = 'Unknown error submitting to provider';
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Provider request timed out';
        } else {
          errorMessage = fetchError.message;
        }
      }
      
      console.error('Error resending refill request to provider:', fetchError);
      return NextResponse.json({
        success: false,
        error: errorMessage,
        data: null
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error resending refill request to provider:', error);
    return NextResponse.json(
      {
        error: 'Failed to resend refill request to provider: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

