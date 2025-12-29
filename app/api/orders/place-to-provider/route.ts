import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ApiRequestBuilder, ApiResponseParser, createApiSpecFromProvider } from '@/lib/provider-api-specification';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, providerId } = body;

    if (!orderId || !providerId) {
      return NextResponse.json(
        { success: false, message: 'Missing orderId or providerId', data: null },
        { status: 400 }
      );
    }

    const order = await db.newOrders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        link: true,
        qty: true,
        charge: true,
        startCount: true,
        remains: true,
        dripfeedRuns: true,
        dripfeedInterval: true,
        service: {
          select: {
            id: true,
            name: true,
            providerServiceId: true
          }
        },
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found', data: null },
        { status: 404 }
      );
    }

    const provider = await db.apiProviders.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Provider not found', data: null },
        { status: 404 }
      );
    }

    if (provider.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Provider is not active', data: null },
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
    
    const serviceOverflow = 0;
    const serviceOverflowAmount = Math.floor((serviceOverflow / 100) * Number(order.qty));
    const quantityWithOverflow = Number(order.qty) + serviceOverflowAmount;

    const providerServiceId = order.service.providerServiceId;
    if (!providerServiceId) {
      return NextResponse.json(
        { success: false, message: 'Service does not have provider service ID', data: null },
        { status: 400 }
      );
    }

    const orderRequest = requestBuilder.buildAddOrderRequest(
      providerServiceId,
      order.link,
      quantityWithOverflow,
      undefined,
      order.dripfeedRuns || undefined,
      order.dripfeedInterval || undefined
    );

    console.log('Sending order to provider:', {
      providerId: provider.id,
      providerName: provider.name,
      orderId: order.id,
      requestConfig: orderRequest
    });

    let providerResponse;
    try {
      const response = await axios({
        method: orderRequest.method,
        url: orderRequest.url,
        data: orderRequest.data,
        headers: orderRequest.headers,
        timeout: 30000,
      });
      providerResponse = response.data;
    } catch (error: any) {
      console.error('Provider API error:', error);
      
      await db.providerOrderLogs.create({
        data: {
          orderId: order.id,
          providerId: provider.id,
          action: 'forward_order',
          status: 'failed',
          response: JSON.stringify({ error: error.message })
        }
      });

      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to forward order to provider', 
          error: error.message,
          data: null 
        },
        { status: 500 }
      );
    }

    const responseParser = new ApiResponseParser(apiSpec);
    let parsedOrder;
    
    try {
      parsedOrder = responseParser.parseAddOrderResponse(providerResponse);
    } catch (parseError) {
      await db.providerOrderLogs.create({
        data: {
          orderId: order.id,
          providerId: provider.id,
          action: 'forward_order',
          status: 'failed',
          response: JSON.stringify(providerResponse)
        }
      });

      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid response format from provider', 
          data: null 
        },
        { status: 500 }
      );
    }

    if (!parsedOrder || !parsedOrder.orderId) {
      await db.providerOrderLogs.create({
        data: {
          orderId: order.id,
          providerId: provider.id,
          action: 'forward_order',
          status: 'failed',
          response: JSON.stringify(providerResponse)
        }
      });

      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid response from provider', 
          data: null 
        },
        { status: 500 }
      );
    }

    const providerOrderId = parsedOrder.orderId.toString();
    console.log(`Order ${order.id} created with provider order ID: ${providerOrderId}. Fetching status and charge...`);

    let apiCharge = 0;
    let orderStatus = 'pending';
    let startCount = order.startCount || 0;
    let remains = order.remains || 0;

    try {
      const statusRequest = requestBuilder.buildOrderStatusRequest(providerOrderId);
      const statusResponse = await axios({
        method: statusRequest.method,
        url: statusRequest.url,
        data: statusRequest.data,
        headers: statusRequest.headers,
        timeout: 30000,
      });

      const parsedStatus = responseParser.parseOrderStatusResponse(statusResponse.data);
      
      const mapProviderStatus = (providerStatus: string): string => {
        if (!providerStatus) return 'pending';
        const normalizedStatus = providerStatus.toLowerCase().trim().replace(/\s+/g, '_');
        const statusMap: { [key: string]: string } = {
          'pending': 'pending',
          'in_progress': 'processing',
          'inprogress': 'processing',
          'processing': 'processing',
          'completed': 'completed',
          'complete': 'completed',
          'partial': 'partial',
          'canceled': 'cancelled',
          'cancelled': 'cancelled',
          'refunded': 'refunded',
          'failed': 'failed',
          'fail': 'failed'
        };
        return statusMap[normalizedStatus] || 'pending';
      };

      orderStatus = mapProviderStatus(parsedStatus.status);
      apiCharge = parsedStatus.charge || 0;
      startCount = parsedStatus.startCount !== undefined ? parsedStatus.startCount : startCount;
      remains = parsedStatus.remains !== undefined ? parsedStatus.remains : remains;

      console.log(`Order ${order.id} status fetched: ${orderStatus}, Charge: ${apiCharge}`);
    } catch (statusError) {
      console.warn(`Could not fetch status for order ${order.id}, using default values:`, statusError);
    }

    const profit = order.charge - apiCharge;

    const updatedOrder = await db.newOrders.update({
      where: { id: orderId },
      data: {
        providerOrderId: providerOrderId,
        providerStatus: orderStatus,
        status: orderStatus,
        charge: apiCharge || order.charge,
        profit: profit,
        startCount: startCount,
        remains: remains,
        lastSyncAt: new Date(),
        updatedAt: new Date()
      }
    });

    await db.providerOrderLogs.create({
      data: {
        orderId: order.id,
        providerId: provider.id,
        action: 'forward_order',
        status: 'success',
        response: JSON.stringify(providerResponse),
        createdAt: new Date()
      }
    });

    console.log('Order forwarded successfully:', {
      orderId: order.id,
      providerOrderId: providerOrderId,
      providerId: provider.id,
      status: orderStatus,
      charge: apiCharge,
      profit: profit
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Order forwarded to provider successfully',
        data: {
          orderId: order.id,
          providerOrderId: providerOrderId,
          providerName: provider.name,
          status: orderStatus,
          charge: apiCharge,
          profit: profit
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error forwarding order to provider:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
