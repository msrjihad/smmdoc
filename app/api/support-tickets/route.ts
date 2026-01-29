import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getTicketSettings } from '@/lib/utils/ticket-settings';
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

async function processRefillRequest(orderIds: string[], userId: number) {
  try {
    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (const orderId of orderIds) {
      try {
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
            }
          }
        });

        if (!order || order.userId !== userId) {
          results.push({ orderId, success: false, message: 'Order not found or access denied' });
          failureCount++;
          continue;
        }

        if (order.status !== 'completed') {
          results.push({ orderId, success: false, message: 'Only completed orders can be refilled' });
          failureCount++;
          continue;
        }

        if (!order.service.refill) {
          results.push({ orderId, success: false, message: 'This service does not support refill' });
          failureCount++;
          continue;
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
          results.push({ orderId, success: false, message: 'A refill request already exists for this order' });
          failureCount++;
          continue;
        }

        const completionTime = new Date(order.updatedAt).getTime();
        const currentTime = new Date().getTime();

        if (order.service.refillDays) {
          const daysSinceCompletion = Math.floor(
            (currentTime - completionTime) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceCompletion > order.service.refillDays) {
            results.push({ orderId, success: false, message: `Refill requests must be made within ${order.service.refillDays} days of order completion` });
            failureCount++;
            continue;
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
                results.push({ orderId, success: false, message: providerEligibility.reason || 'Provider indicates this order is not eligible for refill' });
                failureCount++;
                continue;
              }
            }
          } catch (error) {
            console.error(`Error checking provider refill eligibility for order ${orderId}:`, error);
          }
        }

        const refillRequest = await db.refillRequests.create({
          data: {
            orderId: parseInt(orderId),
            userId: userId,
            reason: 'Automated refill request from AI support ticket',
            status: 'pending'
          }
        });

        try {
          const { sendAdminNewRefillRequestNotification } = await import('@/lib/notifications/admin-notifications');
          const user = await db.users.findUnique({
            where: { id: userId },
            select: { username: true, name: true }
          });
          await sendAdminNewRefillRequestNotification(
            parseInt(orderId),
            user?.username || user?.name || 'User'
          );
        } catch (notificationError) {
          console.error('Error sending admin new refill request notification:', notificationError);
        }

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

                try {
                  const providerResponse = await fetch(refillRequestConfig.url, {
                    method: refillRequestConfig.method,
                    headers: refillRequestConfig.headers || {},
                    body: refillRequestConfig.data,
                    signal: AbortSignal.timeout((apiSpec.timeoutSeconds || 30) * 1000)
                  });

                  if (providerResponse.ok) {
                    const providerResult = await providerResponse.json();
                    if (!providerResult.error) {
                      console.log('Refill request submitted to provider successfully');
                    }
                  }
                } catch (providerError) {
                  console.error('Error submitting refill to provider:', providerError);
                }
              }
            }
          } catch (error) {
            console.error('Error processing provider refill:', error);
          }
        }

        results.push({ orderId, success: true, message: 'Refill request created successfully' });
        successCount++;
      } catch (orderError) {
        console.error(`Error processing refill for order ${orderId}:`, orderError);
        results.push({ orderId, success: false, message: 'System error processing this order' });
        failureCount++;
      }
    }

    return {
      success: successCount > 0,
      message: `Processed ${successCount} refill requests successfully, ${failureCount} failed`,
      details: results,
      successOrderIds: results.filter(r => r.success).map(r => r.orderId),
      failedOrderIds: results.filter(r => !r.success).map(r => r.orderId)
    };
  } catch (error) {
    console.error('Error processing refill requests:', error);
    return { success: false, message: 'System error during refill processing' };
  }
}

async function processCancelRequest(orderIds: string[], userId: number) {
  try {
    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (const orderId of orderIds) {
      try {
        const order = await db.newOrders.findUnique({
          where: { id: parseInt(orderId) },
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

        if (!order || order.userId !== userId) {
          results.push({ orderId, success: false, message: 'Order not found or access denied' });
          failureCount++;
          continue;
        }

        if (!order.service.cancel) {
          results.push({ orderId, success: false, message: 'This service does not support cancellation' });
          failureCount++;
          continue;
        }

        if (!['pending', 'processing', 'in_progress'].includes(order.status.toLowerCase())) {
          results.push({ orderId, success: false, message: 'Only pending or processing orders can be cancelled' });
          failureCount++;
          continue;
        }

        const existingRequest = await db.cancelRequests.findFirst({
          where: {
            orderId: parseInt(orderId)
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (existingRequest) {
          results.push({ orderId, success: false, message: 'A cancellation request for this order already exists. Unable to request to cancel.' });
          failureCount++;
          continue;
        }

        const refundAmount = order.price;

        const isSelfService = !order.service.providerId;

        const cancelRequest = await db.cancelRequests.create({
          data: {
            orderId: parseInt(orderId),
            userId: userId,
            reason: 'Automated cancel request from AI support ticket',
            status: isSelfService ? 'approved' : 'pending',
            refundAmount: refundAmount,
            ...(isSelfService ? {
              processedAt: new Date(),
              adminNotes: 'Automatically approved for self service order'
            } : {})
          }
        });

        if (isSelfService) {
          await db.$transaction(async (tx) => {
            await tx.newOrders.update({
              where: { id: parseInt(orderId) },
              data: { status: 'cancelled' }
            });

            await tx.users.update({
              where: { id: userId },
              data: {
                balance: {
                  increment: refundAmount
                }
              }
            });
          });

          results.push({ orderId, success: true, message: 'Order cancelled successfully (self service)' });
          successCount++;
          continue;
        }

        try {
          const { sendAdminNewCancelRequestNotification } = await import('@/lib/notifications/admin-notifications');
          const user = await db.users.findUnique({
            where: { id: userId },
            select: { username: true, name: true }
          });
          await sendAdminNewCancelRequestNotification(
            parseInt(orderId),
            user?.username || user?.name || 'User'
          );
        } catch (notificationError) {
          console.error('Error sending admin new cancel request notification:', notificationError);
        }

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

                try {
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
                    } else {
                      providerCancelSubmitted = true;
                    }
                  } else {
                    providerCancelError = `Provider API error: ${providerResponse.status} ${providerResponse.statusText}`;
                    shouldMarkAsFailed = true;
                  }
                } catch (error) {
                  providerCancelError = error instanceof Error ? error.message : 'Unknown error submitting to provider';
                  shouldMarkAsFailed = true;
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

        results.push({ orderId, success: true, message: 'Cancel request created successfully' });
        successCount++;
      } catch (orderError) {
        console.error(`Error processing cancel for order ${orderId}:`, orderError);
        results.push({ orderId, success: false, message: 'System error processing this order' });
        failureCount++;
      }
    }

    return {
      success: successCount > 0,
      message: `Processed ${successCount} cancel requests successfully, ${failureCount} failed`,
      details: results,
      successOrderIds: results.filter(r => r.success).map(r => r.orderId),
      failedOrderIds: results.filter(r => !r.success).map(r => r.orderId)
    };
  } catch (error) {
    console.error('Error processing cancel requests:', error);
    return { success: false, message: 'System error during cancel processing' };
  }
}

async function processSpeedUpRequest(orderIds: string[], userId: number) {
  try {
    const results = [];
    
    for (const orderId of orderIds) {
      const order = await db.newOrders.findFirst({
        where: {
          id: parseInt(orderId),
          userId: userId
        },
        include: {
          service: true
        }
      });
      
      if (!order) {
        results.push({ orderId, success: false, message: 'Order not found or access denied' });
        continue;
      }
      
      if (['Completed', 'Cancelled', 'Refunded'].includes(order.status)) {
        results.push({ orderId, success: false, message: 'Order cannot be sped up in current status' });
        continue;
      }
      
        await db.newOrders.update({
          where: { id: parseInt(orderId) },
          data: { status: 'Speed Up Approved' }
        });
      
      results.push({ orderId, success: true, message: 'Speed up request approved' });
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    return {
      success: successCount > 0,
      message: successCount > 0 
        ? `Speed up approved for ${successCount} order(s)${failureCount > 0 ? `, ${failureCount} failed` : ''}` 
        : 'Speed up not available for any orders'
    };
  } catch (error) {
    console.error('Error processing speed up requests:', error);
    return { success: false, message: 'System error during speed up processing' };
  }
}

async function processRestartRequest(orderIds: string[], userId: number) {
  try {
    const results = [];
    
    for (const orderId of orderIds) {
      const order = await db.newOrders.findFirst({
        where: {
          id: parseInt(orderId),
          userId: userId
        },
        include: {
          service: true
        }
      });
      
      if (!order) {
        results.push({ orderId, success: false, message: 'Order not found or access denied' });
        continue;
      }
      
      if (!['Partial', 'Processing', 'In progress'].includes(order.status)) {
        results.push({ orderId, success: false, message: 'Order cannot be restarted in current status' });
        continue;
      }
      
        await db.newOrders.update({
          where: { id: parseInt(orderId) },
          data: { status: 'Restarted' }
        });
      
      results.push({ orderId, success: true, message: 'Order restarted successfully' });
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    return {
      success: successCount > 0,
      message: successCount > 0 
        ? `${successCount} order(s) restarted${failureCount > 0 ? `, ${failureCount} failed` : ''}` 
        : 'Restart failed for all orders'
    };
  } catch (error) {
    console.error('Error processing restart requests:', error);
    return { success: false, message: 'System error during restart processing' };
  }
}

async function processFakeCompleteRequest(orderIds: string[], userId: number) {
  try {
    const results = [];
    
    for (const orderId of orderIds) {
      const order = await db.newOrders.findFirst({
        where: {
          id: parseInt(orderId),
          userId: userId
        },
        include: {
          service: true
        }
      });
      
      if (!order) {
        results.push({ orderId, success: false, message: 'Order not found or access denied' });
        continue;
      }
      
      if (order.status === 'Completed') {
        results.push({ orderId, success: false, message: 'Order is already completed' });
        continue;
      }
      
      const allowedStatuses = ['Pending', 'Processing', 'In progress', 'Partial'];
      if (!allowedStatuses.includes(order.status)) {
        results.push({ orderId, success: false, message: 'Order cannot be marked as fake complete' });
        continue;
      }
      
        await db.newOrders.update({
          where: { id: parseInt(orderId) },
          data: { 
            status: 'Marked as Completed (Fake Complete)',
          }
        });
      
      results.push({ orderId, success: true, message: 'Order marked as completed (Fake Complete)' });
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    return {
      success: successCount > 0,
      message: successCount > 0 
        ? `${successCount} order(s) marked as completed${failureCount > 0 ? `, ${failureCount} failed` : ''}` 
        : 'Fake complete failed for all orders'
    };
  } catch (error) {
    console.error('Error processing fake complete requests:', error);
    return { success: false, message: 'System error during fake complete processing' };
  }
}

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  ticketType: z.enum(['Human', 'AI']).default('Human'),
  aiSubcategory: z.string().optional(),
  orderIds: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  attachments: z.array(z.string()).optional(),
}).refine((data) => {
  if (!data.orderIds || data.orderIds.length === 0) {
    throw new z.ZodError([{
      code: 'custom',
      path: ['orderIds'],
      message: 'Order ID is required for all tickets'
    }]);
  }
    
    const orderIds = data.orderIds.map(id => id.trim()).filter(id => id);
    
    if (orderIds.length === 0) {
      throw new z.ZodError([{
        code: 'custom',
        path: ['orderIds'],
        message: 'At least one valid order ID is required'
      }]);
    }
    
    if (orderIds.length > 10) {
      throw new z.ZodError([{
        code: 'custom',
        path: ['orderIds'],
        message: 'Maximum 10 order IDs allowed per ticket'
      }]);
    }
    
    const invalidIds = orderIds.filter(id => !/^\d+$/.test(id));
    if (invalidIds.length > 0) {
      throw new z.ZodError([{
        code: 'custom',
        path: ['orderIds'],
        message: `Invalid order ID format: ${invalidIds.join(', ')}. Order IDs should be numeric.`
      }]);
    }
  
  return true;
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ticketSettings = await getTicketSettings();
    if (!ticketSettings.ticketSystemEnabled) {
      return NextResponse.json(
        { error: 'Ticket system is currently disabled' },
        { status: 403 }
      );
    }

    const pendingTicketsCount = await db.supportTickets.count({
      where: {
        userId: parseInt(session.user.id),
        status: {
          in: ['Open', 'in_progress']
        }
      }
    });

    const maxPendingTickets = parseInt(ticketSettings.maxPendingTickets || '3');
    if (pendingTicketsCount >= maxPendingTickets) {
      return NextResponse.json(
        { error: `You have reached the maximum limit of ${maxPendingTickets} pending tickets` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    const orderIds = validatedData.orderIds ? validatedData.orderIds.map(id => id.trim()).filter(id => id) : [];
    
    if (orderIds.length > 0) {
      const userOrders = await db.newOrders.findMany({
        where: {
          id: { in: orderIds.map(id => parseInt(id)) },
          userId: parseInt(session.user.id)
        },
        select: { id: true }
      });
      
      const foundOrderIds = userOrders.map(order => order.id.toString());
      const invalidOrderIds = orderIds.filter(id => !foundOrderIds.includes(id));
      
      if (invalidOrderIds.length > 0) {
        return NextResponse.json(
          { error: `Order ID(s) not found or do not belong to you: ${invalidOrderIds.join(', ')}` },
          { status: 400 }
        );
      }
    }

    let systemMessage = '';
    let ticketStatus = 'Open';
    let finalMessage = validatedData.message;
    
    if (validatedData.ticketType === 'AI' && validatedData.aiSubcategory) {
      if (orderIds.length > 0) {
        try {
          if (validatedData.aiSubcategory === 'Refill') {
            const refillResult = await processRefillRequest(orderIds, parseInt(session.user.id));
            const successIds = refillResult.successOrderIds || [];
            const failedIds = refillResult.failedOrderIds || [];
            
            const successLabel = successIds.length === 1 ? 'Order ID' : 'Order IDs';
            const failedLabel = failedIds.length === 1 ? 'order' : 'order';
            const allOrderLabel = orderIds.length === 1 ? 'Order ID' : 'Order IDs';
            
            if (successIds.length > 0 && failedIds.length === 0) {
              systemMessage = `Your ${successLabel} ${successIds.join(', ')} has been requested to refill.\n\nThank you for using our service.`;
            } else if (successIds.length > 0 && failedIds.length > 0) {
              systemMessage = `Your ${successLabel} ${successIds.join(', ')} has been request to refill and ${failedIds.join(', ')} ${failedLabel} cannot be request to refill because of error or not eligibility.\n\nThank you for using our service.`;
            } else {
              systemMessage = `Unable to request to refill the ${allOrderLabel} ${orderIds.join(', ')}.\n\nThank you for using our service.`;
            }
            ticketStatus = 'closed';
          } else if (validatedData.aiSubcategory === 'Cancel') {
            const cancelResult = await processCancelRequest(orderIds, parseInt(session.user.id));
            const successIds = cancelResult.successOrderIds || [];
            const failedIds = cancelResult.failedOrderIds || [];
            
            const successLabel = successIds.length === 1 ? 'Order ID' : 'Order IDs';
            const failedLabel = failedIds.length === 1 ? 'order' : 'order';
            const allOrderLabel = orderIds.length === 1 ? 'Order ID' : 'Order IDs';
            
            if (successIds.length > 0 && failedIds.length === 0) {
              systemMessage = `Your ${successLabel} ${successIds.join(', ')} has been requested to cancel.\n\nThank you for using our service.`;
            } else if (successIds.length > 0 && failedIds.length > 0) {
              systemMessage = `Your ${successLabel} ${successIds.join(', ')} has been request to cancel and ${failedIds.join(', ')} ${failedLabel} cannot be request to cancel because of error or not eligibility.\n\nThank you for using our service.`;
            } else {
              systemMessage = `Unable to request to cancel the ${allOrderLabel} ${orderIds.join(', ')}.\n\nThank you for using our service.`;
            }
            ticketStatus = 'closed';
          } else if (validatedData.aiSubcategory === 'Speed Up') {
            const speedUpResult = await processSpeedUpRequest(orderIds, parseInt(session.user.id));
            systemMessage = speedUpResult.success 
              ? '⚡ Speed Up Approved. Your order processing has been prioritized.'
              : '❌ Speed Up Not Available. Order may not be eligible for speed up.';
          } else if (validatedData.aiSubcategory === 'Restart') {
            const restartResult = await processRestartRequest(orderIds, parseInt(session.user.id));
            systemMessage = restartResult.success 
              ? '🔁 Restarted. Your order has been restarted and will be processed again.'
              : '❌ Restart Failed. Order may not be eligible for restart.';
          } else if (validatedData.aiSubcategory === 'Fake Complete') {
            const fakeCompleteResult = await processFakeCompleteRequest(orderIds, parseInt(session.user.id));
            systemMessage = fakeCompleteResult.success 
              ? '🎭 Marked as Completed (Fake Complete). This action has been logged for admin review.'
              : '❌ Fake Complete Failed. Order may not be eligible or is already completed.';
          }
        } catch (error) {
          console.error('Error processing AI ticket:', error);
          systemMessage = `Processing failed due to system error. Please contact support.`;
        }
      } else {
        systemMessage = 'No valid order IDs provided for processing.';
      }
      
    }

    const ticket = await db.supportTickets.create({
      data: {
        userId: parseInt(session.user.id),
        subject: validatedData.subject,
        message: finalMessage,
        category: validatedData.category,
        subcategory: validatedData.subcategory,
        ticketType: validatedData.ticketType,
        aiSubcategory: validatedData.aiSubcategory,
        systemMessage: systemMessage || null,
        orderIds: validatedData.orderIds ? JSON.stringify(validatedData.orderIds) : null,
        priority: validatedData.priority,
        attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : null,
        status: ticketStatus,
        isRead: validatedData.ticketType === 'AI' ? true : false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          }
        }
      }
    });

    await db.ticketMessages.create({
      data: {
        ticketId: ticket.id,
        userId: parseInt(session.user.id),
        message: finalMessage,
        messageType: 'customer',
        isFromAdmin: false,
        attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : null,
      }
    });

    if (systemMessage && validatedData.ticketType === 'AI') {
      await db.$transaction([
        db.ticketMessages.create({
          data: {
            ticketId: ticket.id,
            userId: parseInt(session.user.id),
            message: systemMessage,
            messageType: 'system',
            isFromAdmin: false,
          }
        }),
        db.supportTickets.update({
          where: { id: ticket.id },
          data: { updatedAt: new Date() }
        })
      ]);
    }

    if (validatedData.ticketType === 'Human') {
      try {
        const { sendAdminSupportTicketNotification } = await import('@/lib/notifications/admin-notifications');
        await sendAdminSupportTicketNotification(
          ticket.id,
          ticket.user.username || ticket.user.name || 'User'
        );
      } catch (notificationError) {
        console.error('Error sending admin support ticket notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        category: ticket.category,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
      }
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ticketSettings = await getTicketSettings();
    if (!ticketSettings.ticketSystemEnabled) {
      return NextResponse.json(
        { error: 'Ticket system is currently disabled' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    const skip = (page - 1) * limit;

    const where: any = {
      userId: parseInt(session.user.id),
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [tickets, totalCount] = await Promise.all([
      db.supportTickets.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
        include: {
          repliedByUser: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),
      db.supportTickets.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const transformedTickets = tickets.map(ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      lastUpdated: ticket.updatedAt.toISOString(),
      priority: ticket.priority,
      ticketType: ticket.ticketType,
      category: ticket.category,
      subcategory: ticket.subcategory,
      aiSubcategory: ticket.aiSubcategory,
      orderIds: ticket.orderIds ? JSON.parse(ticket.orderIds) : [],
      repliedByUser: ticket.repliedByUser
    }));

    return NextResponse.json({
      success: true,
      tickets: transformedTickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
