import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createApiSpecFromProvider } from '@/lib/provider-api-specification';

function serializeForJson<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj) as T;
  if (Array.isArray(obj)) return obj.map(serializeForJson) as T;
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = serializeForJson(v);
    }
    return out as T;
  }
  return obj;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Admin or Moderator privileges required.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { link } = body;

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

    if (!link || typeof link !== 'string' || link.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Valid order link is required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

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
            providerId: true,
            providerServiceId: true
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

    const previousLink = order.link;
    const newLink = link.trim();

    let providerUpdateSuccess = false;
    let providerUpdateError: string | null = null;

    if (order.providerOrderId && order.service?.providerId) {
      try {
        const provider = await db.apiProviders.findUnique({
          where: { id: order.service.providerId }
        });

        if (provider && provider.status === 'active') {
          console.log(`Attempting to update order ${orderId} link on provider ${provider.name}...`);
          
          const apiType = (provider as any).api_type || (provider as any).apiType || 1;
          
          if (apiType === 1) {
            const apiSpec = createApiSpecFromProvider(provider);

            const editParams: Record<string, any> = {
              [apiSpec.apiKeyParam]: provider.api_key,
              [apiSpec.actionParam]: 'edit',
              [apiSpec.orderIdParam]: order.providerOrderId,
              [apiSpec.linkParam]: newLink
            };

            const endpoint = apiSpec.addOrderEndpoint || provider.api_url;
            const httpMethod = (provider as any).http_method || (provider as any).httpMethod || 'POST';
            const requestFormat = apiSpec.requestFormat || 'form';
            
            let editUrl = endpoint;
            let editHeaders: Record<string, string> = {};
            let editBody: string | undefined;

            if (requestFormat === 'json' || httpMethod === 'GET') {
              if (requestFormat === 'json') {
                editHeaders['Content-Type'] = 'application/json';
                editBody = JSON.stringify(editParams);
              } else {
                const queryString = new URLSearchParams(editParams).toString();
                editUrl = `${endpoint}?${queryString}`;
              }
            } else {
              editHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
              editBody = new URLSearchParams(editParams).toString();
            }

            const timeout = (apiSpec.timeoutSeconds || 30) * 1000;

            try {
              const response = await fetch(editUrl, {
                method: httpMethod,
                headers: editHeaders,
                body: editBody,
                signal: AbortSignal.timeout(timeout)
              });

              if (response.ok) {
                const result = await response.json();
                if (!result.error) {
                  providerUpdateSuccess = true;
                  console.log(`Successfully updated order ${orderId} link on provider ${provider.name}`);
                } else {
                  providerUpdateError = result.error || 'Provider returned an error';
                  console.warn(`Provider update returned error for order ${orderId}:`, result.error);
                }
              } else {
                providerUpdateError = `Provider API returned status ${response.status}`;
                console.warn(`Provider update failed for order ${orderId}: HTTP ${response.status}`);
              }
            } catch (updateError) {
              providerUpdateError = updateError instanceof Error ? updateError.message : 'Unknown error';
              console.warn(`Provider update attempt failed for order ${orderId}:`, updateError);
            }
          } else if (apiType === 3) {
            console.log(`Provider ${provider.name} uses SocialsMedia API type. Order update may not be supported.`);
            providerUpdateError = 'SocialsMedia API does not support order updates';
          } else {
            console.log(`Provider ${provider.name} uses API type ${apiType}. Order update may not be supported.`);
            providerUpdateError = `API type ${apiType} update not implemented`;
          }
        }
      } catch (providerError) {
        console.error(`Error attempting to update provider for order ${orderId}:`, providerError);
        providerUpdateError = providerError instanceof Error ? providerError.message : 'Unknown error';
      }
    }

    const updatedOrder = await db.newOrders.update({
      where: { id: orderId },
      data: {
        link: newLink,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true
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

    console.log(`Admin ${session.user.email} updated order ${id} link`, {
      orderId: id,
      previousLink: previousLink,
      newLink: newLink,
      providerOrderId: order.providerOrderId,
      providerUpdateAttempted: !!order.providerOrderId,
      providerUpdateSuccess: providerUpdateSuccess,
      providerUpdateError: providerUpdateError,
      timestamp: new Date().toISOString()
    });

    const message = providerUpdateSuccess
      ? 'Order link updated successfully on database and provider'
      : providerUpdateError
      ? `Order link updated in database. Provider update failed: ${providerUpdateError}`
      : 'Order link updated successfully';

    return NextResponse.json({
      success: true,
      message: message,
      data: serializeForJson(updatedOrder),
      error: providerUpdateError || null,
      providerUpdateSuccess: providerUpdateSuccess
    });

  } catch (error) {
    console.error('Error updating order link:', error);
    return NextResponse.json(
      {
        error: 'Failed to update order link: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

