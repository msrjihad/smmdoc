import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ProviderOrderForwarder } from '@/lib/utils/provider-order-forwarder';
import { ApiRequestBuilder, ApiResponseParser, createApiSpecFromProvider } from '@/lib/provider-api-specification';
import axios from 'axios';

export async function POST(
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
      select: {
        id: true,
        status: true,
        providerStatus: true,
        providerOrderId: true,
        link: true,
        qty: true,
        charge: true,
        startCount: true,
        remains: true,
        dripfeedRuns: true,
        dripfeedInterval: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            currency: true,
            dollarRate: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true,
            providerId: true,
            providerServiceId: true,
            mode: true
          }
        },
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

    if (order.status !== 'failed' && order.providerStatus !== 'forward_failed') {
      return NextResponse.json(
        {
          error: 'Only failed orders can be resent',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    console.log(`Admin ${session.user.email} attempting to resend order ${order.id} for user ${order.user.email}`, {
      orderId: order.id,
      userId: order.user.id,
      serviceId: order.service.id,
      isProviderService: !!order.service.providerId,
      providerOrderId: order.providerOrderId,
      status: order.status,
      providerStatus: order.providerStatus,
      timestamp: new Date().toISOString()
    });

    let resendResult = null;
    let newStatus = 'pending';

    if (order.service.providerId && order.service.providerServiceId) {
      const apiProvider = await db.apiProviders.findUnique({
        where: { id: order.service.providerId }
      });

      if (!apiProvider) {
        return NextResponse.json(
          {
            error: 'API provider not found for this service',
            success: false,
            data: null
          },
          { status: 404 }
        );
      }

      if (!order.service.providerServiceId) {
        return NextResponse.json(
          {
            error: 'Service provider service ID is missing. Cannot resend to provider.',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
      const providerForBalance: any = {
        id: apiProvider.id,
        name: apiProvider.name,
        api_url: apiProvider.api_url,
        api_key: apiProvider.api_key,
        status: apiProvider.status
      };

      try {
        const providerForwarder = ProviderOrderForwarder.getInstance();

        if (apiProvider.status !== 'active') {
          return NextResponse.json(
            {
              error: 'API provider is not active. Cannot resend order.',
              success: false,
              data: null
            },
            { status: 400 }
          );
        }

        try {
          const providerBalance = await providerForwarder.getProviderBalance(providerForBalance);
          const orderCost = order.charge || (order.service.rate * Number(order.qty)) / 1000;

          if (providerBalance < orderCost) {
            console.log(`Provider ${apiProvider.name} has insufficient balance. Required: ${orderCost}, Available: ${providerBalance}`);
            
            return NextResponse.json(
              {
                error: `Provider has insufficient balance. Required: ${orderCost.toFixed(2)}, Available: ${providerBalance.toFixed(2)}`,
                errorType: 'insufficient_balance',
                success: false,
                data: null
              },
              { status: 400 }
            );
          }
        } catch (balanceError) {
          console.error('Error checking provider balance:', balanceError);
          const errorMessage = balanceError instanceof Error ? balanceError.message : 'Unknown error';
          return NextResponse.json(
            {
              error: `Failed to check provider balance: ${errorMessage}`,
              success: false,
              data: null
            },
            { status: 500 }
          );
        }

        if (order.providerOrderId) {
          console.log(`Order ${order.id} already has provider order ID: ${order.providerOrderId}. Syncing existing order status...`);
          
          let statusResult;
          let apiResponseData = null;
          try {
            const apiSpec = createApiSpecFromProvider(apiProvider);
            const apiBuilder = new ApiRequestBuilder(
              apiSpec,
              apiProvider.api_url,
              apiProvider.api_key,
              (apiProvider as any).http_method || (apiProvider as any).httpMethod || 'POST'
            );

            const statusRequest = apiBuilder.buildOrderStatusRequest(order.providerOrderId);

            const response = await axios({
              method: statusRequest.method,
              url: statusRequest.url,
              data: statusRequest.data,
              headers: statusRequest.headers,
              timeout: ((apiProvider as any).timeout_seconds || 30) * 1000
            });

            apiResponseData = response.data;

            if (!apiResponseData) {
              throw new Error('Empty response from provider');
            }

            const responseParser = new ApiResponseParser(apiSpec);
            const parsedStatus = responseParser.parseOrderStatusResponse(apiResponseData);
            
            statusResult = {
              charge: parsedStatus.charge || 0,
              start_count: parsedStatus.startCount !== undefined ? parsedStatus.startCount : BigInt(0),
              status: parsedStatus.status || 'pending',
              remains: parsedStatus.remains !== undefined ? parsedStatus.remains : BigInt(0),
              currency: parsedStatus.currency || 'USD'
            };
          } catch (statusError) {
            console.error(`Failed to sync order status:`, statusError);
            throw new Error(`Failed to sync order status: ${statusError instanceof Error ? statusError.message : String(statusError)}`);
          }
          
          const apiCharge = statusResult.charge || 0;
          newStatus = statusResult.status || 'pending';
          const profit = order.charge - apiCharge;
          
          const startCountValue = statusResult.start_count !== undefined 
            ? statusResult.start_count 
            : (order.startCount || BigInt(0));
          
          const remainsValue = statusResult.remains !== undefined 
            ? statusResult.remains 
            : (order.remains || BigInt(0));
          
          try {
            await db.newOrders.update({
              where: { id: orderId },
              data: {
                status: newStatus,
                providerStatus: newStatus,
                charge: apiCharge,
                profit: profit,
                startCount: startCountValue,
                remains: remainsValue,
                apiResponse: apiResponseData ? JSON.stringify(apiResponseData) : null,
                lastSyncAt: new Date(),
                updatedAt: new Date()
              }
            });
            console.log(`Order ${order.id} successfully synced. Provider order ID: ${order.providerOrderId}, Status: ${newStatus}, Charge: ${apiCharge}, Profit: ${profit}, Remains: ${remainsValue}, StartCount: ${startCountValue}`);
          } catch (dbError) {
            console.error(`Order synced successfully, but database update failed:`, dbError);
            const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
            return NextResponse.json(
              {
                error: `Order synced but database update failed: ${errorMessage}`,
                success: false,
                data: null
              },
              { status: 500 }
            );
          }
        } else {
          console.log(`Resending order ${order.id} to provider - creating new order to API`);
          
          const orderData = {
            service: order.service.providerServiceId,
            link: order.link,
            quantity: Number(order.qty),
            runs: order.dripfeedRuns || undefined,
            interval: order.dripfeedInterval || undefined
          };

          resendResult = await providerForwarder.forwardOrderToProvider(providerForBalance, orderData);

          if (!resendResult.order) {
            throw new Error('Failed to create order: Provider did not return order ID');
          }

          console.log(`Order created with provider order ID: ${resendResult.order}. Fetching status and charge...`);

          let statusResult;
          let apiResponseData = null;
          try {
            statusResult = await providerForwarder.checkProviderOrderStatus(providerForBalance, resendResult.order);
          } catch (statusError) {
            console.warn(`Failed to fetch order status, using forward result values:`, statusError);
            statusResult = {
              charge: resendResult.charge || 0,
              start_count: BigInt(0),
              status: resendResult.status || 'pending',
              remains: BigInt(Number(order.qty)),
              currency: 'USD'
            };
          }
          
          try {
            const apiSpec = createApiSpecFromProvider(apiProvider);
            const apiBuilder = new ApiRequestBuilder(
              apiSpec,
              apiProvider.api_url,
              apiProvider.api_key,
              (apiProvider as any).http_method || (apiProvider as any).httpMethod || 'POST'
            );

            const statusRequest = apiBuilder.buildOrderStatusRequest(String(resendResult.order));

            const response = await axios({
              method: statusRequest.method,
              url: statusRequest.url,
              data: statusRequest.data,
              headers: statusRequest.headers,
              timeout: ((apiProvider as any).timeout_seconds || 30) * 1000
            });

            apiResponseData = response.data;

            if (apiResponseData) {
              const responseParser = new ApiResponseParser(apiSpec);
              const parsedStatus = responseParser.parseOrderStatusResponse(apiResponseData);
              
              statusResult = {
                charge: parsedStatus.charge !== undefined ? parsedStatus.charge : (statusResult.charge || 0),
                start_count: parsedStatus.startCount !== undefined ? parsedStatus.startCount : statusResult.start_count,
                status: parsedStatus.status || statusResult.status || 'pending',
                remains: parsedStatus.remains !== undefined ? parsedStatus.remains : statusResult.remains,
                currency: parsedStatus.currency || statusResult.currency || 'USD'
              };
            }
          } catch (fullStatusError) {
            console.warn(`Failed to fetch full order status, using partial data:`, fullStatusError);
          }
          
          const apiCharge = statusResult.charge || resendResult.charge || 0;
          newStatus = statusResult.status || resendResult.status || 'pending';
          const profit = order.charge - apiCharge;
          
          const startCountValue = statusResult.start_count !== undefined 
            ? statusResult.start_count 
            : (order.startCount || BigInt(0));
          
          const remainsValue = statusResult.remains !== undefined 
            ? statusResult.remains 
            : (order.remains || BigInt(0));
          
          try {
            await db.newOrders.update({
              where: { id: orderId },
              data: {
                status: newStatus,
                providerOrderId: resendResult.order ? String(resendResult.order) : null,
                providerStatus: newStatus,
                charge: apiCharge,
                profit: profit,
                startCount: startCountValue,
                remains: remainsValue,
                apiResponse: apiResponseData ? JSON.stringify(apiResponseData) : null,
                lastSyncAt: new Date(),
                updatedAt: new Date()
              }
            });
            console.log(`Order ${order.id} successfully resent to provider. New provider order ID: ${resendResult.order}, Status: ${newStatus}, Charge: ${apiCharge}, Profit: ${profit}, Remains: ${remainsValue}, StartCount: ${startCountValue}`);
          } catch (dbError) {
            console.error(`Order sent to provider successfully, but database update failed:`, dbError);
            const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
            return NextResponse.json(
              {
                error: `Order sent but database update failed: ${errorMessage}`,
                success: false,
                data: null
              },
              { status: 500 }
            );
          }
        }

      } catch (providerError) {
        console.error('Error resending order to provider:', providerError);
        
        const errorMessage = providerError instanceof Error ? providerError.message : String(providerError);
        
        if (errorMessage.toLowerCase().includes('balance') || errorMessage.toLowerCase().includes('insufficient')) {
          return NextResponse.json(
            {
              error: 'Provider has insufficient balance to process this order',
              errorType: 'insufficient_balance',
              success: false,
              data: null
            },
            { status: 400 }
          );
        }

        if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('network')) {
          return NextResponse.json(
            {
              error: 'Provider API timeout. Please try again later',
              success: false,
              data: null
            },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            error: `Failed to resend order to provider: ${errorMessage}`,
            success: false,
            data: null
          },
          { status: 500 }
        );
      }
    } else {
      await db.newOrders.update({
        where: { id: orderId },
        data: {
          status: 'pending',
          updatedAt: new Date()
        }
      });

      console.log(`Manual order ${order.id} status updated to pending for resend`);
    }

    const updatedOrder = await db.newOrders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            currency: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true,
            providerId: true
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

    if (!updatedOrder) {
      return NextResponse.json(
        {
          error: 'Order not found after update',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    const syncMessage = updatedOrder.providerOrderId 
      ? 'Order synced successfully with latest provider data' 
      : 'Order resent successfully';

    const serializedOrder = {
      ...updatedOrder,
      qty: typeof updatedOrder.qty === 'bigint' ? updatedOrder.qty.toString() : updatedOrder.qty,
      remains: typeof updatedOrder.remains === 'bigint' ? updatedOrder.remains.toString() : updatedOrder.remains,
      startCount: typeof updatedOrder.startCount === 'bigint' ? updatedOrder.startCount.toString() : updatedOrder.startCount,
      minQty: updatedOrder.minQty && typeof updatedOrder.minQty === 'bigint' ? updatedOrder.minQty.toString() : updatedOrder.minQty,
      maxQty: updatedOrder.maxQty && typeof updatedOrder.maxQty === 'bigint' ? updatedOrder.maxQty.toString() : updatedOrder.maxQty,
    };

    if (updatedOrder.providerOrderId && updatedOrder.service.providerId) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
          process.env.NEXTAUTH_URL || 
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
        
        if (!baseUrl) {
          throw new Error('NEXT_PUBLIC_APP_URL or NEXTAUTH_URL environment variable is required');
        }
        
        fetch(`${baseUrl}/api/admin/provider-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('cookie') || ''
          },
          body: JSON.stringify({ syncAll: true })
        }).catch(syncError => {
          console.warn('Background sync trigger failed (non-critical):', syncError);
        });
      } catch (syncTriggerError) {
        console.warn('Failed to trigger background sync (non-critical):', syncTriggerError);
      }
    }

    return NextResponse.json({
      success: true,
      message: syncMessage,
      data: serializedOrder,
      error: null
    });

  } catch (error) {
    console.error('Error in resend order API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: `Internal server error while resending order: ${errorMessage}`,
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
