import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ApiRequestBuilder, ApiResponseParser, createApiSpecFromProvider } from '@/lib/provider-api-specification';
import axios from 'axios';

export async function POST(req: NextRequest) {
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

    const refillRequests = await db.refillRequests.findMany({
      where: {
        status: {
          in: ['pending', 'refilling']
        }
      },
      include: {
        order: {
          include: {
            service: {
              select: {
                id: true,
                providerId: true,
                providerName: true
              }
            }
          }
        }
      }
    });

    const results = {
      synced: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const refillRequest of refillRequests) {
      const order = refillRequest.order;
      
      if (!order || !order.service?.providerId || !order.providerOrderId) {
        results.skipped++;
        continue;
      }

      try {
        const provider = await db.apiProviders.findUnique({
          where: { id: order.service.providerId }
        });

        if (!provider || provider.status !== 'active') {
          results.skipped++;
          continue;
        }

        const apiSpec = createApiSpecFromProvider(provider);
        const apiBuilder = new ApiRequestBuilder(
          apiSpec,
          provider.api_url,
          provider.api_key,
          (provider as any).http_method || (provider as any).httpMethod || 'POST'
        );

        const responseParser = new ApiResponseParser(apiSpec);
        
        let providerRefillId = '';
        try {
          if (refillRequest.adminNotes) {
            const adminNotes = JSON.parse(refillRequest.adminNotes);
            providerRefillId = adminNotes.providerRefillId || '';
          }
        } catch (e) {
        }

        if (providerRefillId) {
          const refillStatusRequest = apiBuilder.buildRefillStatusRequest(providerRefillId);

          const response = await axios({
            method: refillStatusRequest.method,
            url: refillStatusRequest.url,
            data: refillStatusRequest.data,
            headers: refillStatusRequest.headers,
            timeout: ((provider as any).timeout_seconds || 30) * 1000
          });

          const responseData = response.data;

          if (!responseData) {
            throw new Error('Empty response from provider');
          }

          const parsedRefillStatus = responseParser.parseRefillStatusResponse(responseData);
          const providerStatus = parsedRefillStatus.status || responseData.status || 'pending';

          const refillStatusMap: Record<string, string> = {
            'success': 'completed',
            'completed': 'completed',
            'complete': 'completed',
            'refilling': 'refilling',
            'in_progress': 'refilling',
            'processing': 'refilling',
            'pending': 'pending',
            'rejected': 'rejected',
            'reject': 'rejected',
            'failed': 'error',
            'error': 'error'
          };
          
          const mappedRefillStatus = refillStatusMap[providerStatus.toLowerCase()] || refillRequest.status;
          
          if (mappedRefillStatus !== refillRequest.status) {
            await db.refillRequests.update({
              where: { id: refillRequest.id },
              data: {
                status: mappedRefillStatus,
                updatedAt: new Date()
              }
            });
          }
        } else {
          const statusRequest = apiBuilder.buildOrderStatusRequest(String(order.providerOrderId));

          const response = await axios({
            method: statusRequest.method,
            url: statusRequest.url,
            data: statusRequest.data,
            headers: statusRequest.headers,
            timeout: ((provider as any).timeout_seconds || 30) * 1000
          });

          const responseData = response.data;

          if (!responseData) {
            throw new Error('Empty response from provider');
          }

          const parsedStatus = responseParser.parseOrderStatusResponse(responseData);

          if (parsedStatus.status) {
            const mappedStatus = mapProviderStatus(parsedStatus.status);
            
            await db.newOrders.update({
              where: { id: order.id },
              data: {
                providerStatus: mappedStatus,
                status: mappedStatus,
                ...(parsedStatus.remains !== undefined && parsedStatus.remains !== null && {
                  remains: parsedStatus.remains
                }),
                ...(parsedStatus.startCount !== undefined && parsedStatus.startCount !== null && {
                  startCount: parsedStatus.startCount
                })
              }
            });
          }

          const orderStatus = parsedStatus.status?.toLowerCase() || '';
          if (orderStatus === 'completed' && refillRequest.status === 'refilling') {
            await db.refillRequests.update({
              where: { id: refillRequest.id },
              data: {
                status: 'completed',
                updatedAt: new Date()
              }
            });
          }
        }

        results.synced++;
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Order ${order.id}: ${errorMessage}`);
        console.error(`Error syncing provider status for refill request ${refillRequest.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        synced: results.synced,
        failed: results.failed,
        skipped: results.skipped,
        total: refillRequests.length,
        errors: results.errors.slice(0, 10)
      },
      message: `Synced ${results.synced} orders, ${results.failed} failed, ${results.skipped} skipped`,
      error: null
    });

  } catch (error) {
    console.error('Error syncing provider status for refill requests:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync provider status: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

function mapProviderStatus(providerStatus: string): string {
  const status = providerStatus?.toLowerCase() || '';
  
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'processing': 'processing',
    'in progress': 'in_progress',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'complete': 'completed',
    'partial': 'partial',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'refunded': 'refunded',
    'failed': 'failed',
    'error': 'failed'
  };

  return statusMap[status] || 'pending';
}

