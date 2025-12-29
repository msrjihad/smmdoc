import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { validateOrderByType, getServiceTypeConfig } from '@/lib/service-types';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        id: true,
        balance: true,
        currency: true,
        dollarRate: true,
        total_spent: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
          data: null,
        },
        { status: 404 }
      );
    }

    const moduleSettings = await db.moduleSettings.findFirst();
    const massOrderEnabled = moduleSettings?.massOrderEnabled ?? false;

    if (!massOrderEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: 'Mass Order functionality is currently disabled',
          data: null,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orders, validateOnly = false, batchId } = body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Orders must be a non-empty array',
          data: null,
        },
        { status: 400 }
      );
    }

    if (orders.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Maximum 100 orders allowed per Mass Orders request',
          data: null,
        },
        { status: 400 }
      );
    }

    const validatedOrders: any[] = [];
    let totalCost = 0;
    const validationErrors = [];

    for (let i = 0; i < orders.length; i++) {
      const orderData = orders[i];
      const { 
        categoryId, 
        serviceId, 
        link, 
        qty,
        comments,
        username,
        posts,
        delay,
        minQty,
        maxQty,
        isDripfeed = false,
        dripfeedRuns,
        dripfeedInterval,
        isSubscription = false
      } = orderData;

      try {
        if (!categoryId || !serviceId || !link || !qty) {
          validationErrors.push(
            `Order ${
              i + 1
            }: Missing required fields (categoryId, serviceId, link, qty)`
          );
          continue;
        }

        const service = await db.services.findUnique({
          where: { id: serviceId },
          select: {
            id: true,
            name: true,
            rate: true,
            min_order: true,
            max_order: true,
            avg_time: true,
            status: true,
            packageType: true,
          },
        });

        if (!service) {
          validationErrors.push(
            `Order ${i + 1}: Service not found (${serviceId})`
          );
          continue;
        }

        if (service.status !== 'active') {
          validationErrors.push(
            `Order ${i + 1}: Service '${service.name}' is not active`
          );
          continue;
        }

        const quantity = parseInt(qty);
        if (
          isNaN(quantity) ||
          quantity < service.min_order ||
          quantity > service.max_order
        ) {
          validationErrors.push(
            `Order ${i + 1}: Quantity for '${service.name}' must be between ${
              service.min_order
            } and ${service.max_order}`
          );
          continue;
        }

        const serviceTypeId = service.packageType || 1;
        const typeConfig = getServiceTypeConfig(serviceTypeId);
        const validationData = {
          link: link,
          qty: quantity,
          comments: comments,
          username: username,
          posts: posts,
          delay: delay,
          minQty: minQty,
          maxQty: maxQty,
          isDripfeed: isDripfeed,
          dripfeedRuns: dripfeedRuns,
          dripfeedInterval: dripfeedInterval,
          isSubscription: isSubscription
        };

        const validationErrorsList = typeConfig ? validateOrderByType(serviceTypeId, validationData) : { general: 'Invalid service type' };
        if (validationErrorsList && Object.keys(validationErrorsList).length > 0) {
          const errorMessages = Object.values(validationErrorsList).join(', ');
          validationErrors.push(
            `Order ${i + 1}: Service type validation failed for '${service.name}': ${errorMessages}`
          );
          continue;
        }

        const usdPrice = (service.rate * quantity) / 1000;
        const finalPrice = user.currency === 'USD' ? usdPrice : usdPrice * (user.dollarRate || 121.52);
        
        const charge = usdPrice;
        const profit = finalPrice - charge;

        totalCost += finalPrice;

        validatedOrders.push({
          orderIndex: i + 1,
          categoryId,
          serviceId,
          userId: session.user.id,
          link,
          qty: quantity,
          price: finalPrice,
          charge: charge,
          profit: profit,
          usdPrice,
          currency: user.currency,
          avg_time: service.avg_time,
          status: 'pending',
          remains: quantity,
          startCount: 0,
          isMassOrder: true,
          batchId: batchId || `MO-${Date.now()}-${(session.user.id as any).toString().slice(-4)}`,
          packageType: service.packageType || 1,
          comments: comments || null,
          username: username || null,
          posts: posts ? parseInt(posts) : null,
          delay: delay ? parseInt(delay) : null,
          minQty: minQty ? parseInt(minQty) : null,
          maxQty: maxQty ? parseInt(maxQty) : null,
          isDripfeed,
          dripfeedRuns: dripfeedRuns ? parseInt(dripfeedRuns) : null,
          dripfeedInterval: dripfeedInterval ? parseInt(dripfeedInterval) : null,
          isSubscription,
          subscriptionStatus: isSubscription ? 'active' : null,
          service: {
            name: service.name,
            rate: service.rate,
          },
        });
      } catch (error) {
        validationErrors.push(
          `Order ${i + 1}: Validation error - ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed for some orders',
          data: null,
          errors: validationErrors,
          validOrders: validatedOrders.length,
          totalOrders: orders.length,
        },
        { status: 400 }
      );
    }

    if (user.balance < totalCost) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient balance. Required: ${totalCost.toFixed(2)} ${
            user.currency
          }, Available: ${user.balance.toFixed(2)} ${user.currency}`,
          data: null,
          summary: {
            totalCost,
            availableBalance: user.balance,
            currency: user.currency,
            validOrders: validatedOrders.length,
          },
        },
        { status: 400 }
      );
    }

    if (validateOnly) {
      return NextResponse.json(
        {
          success: true,
          message: 'Validation successful',
          data: {
            validOrders: validatedOrders.length,
            totalOrders: orders.length,
            totalCost,
            currency: user.currency,
            availableBalance: user.balance,
            canAfford: user.balance >= totalCost,
          },
        },
        { status: 200 }
      );
    }

    const result = await db.$transaction(async (prisma) => {
      const createdOrders = [];

      for (const orderData of validatedOrders) {
        const { orderIndex, service, ...createData } = orderData;

        const order = await prisma.newOrders.create({
          data: {
            ...createData,
            packageType: orderData.packageType,
            comments: orderData.comments,
            username: orderData.username,
            posts: orderData.posts,
            delay: orderData.delay,
            minQty: orderData.minQty,
            maxQty: orderData.maxQty,
            isDripfeed: orderData.isDripfeed,
            dripfeedRuns: orderData.dripfeedRuns,
            dripfeedInterval: orderData.dripfeedInterval,
            isSubscription: orderData.isSubscription,
            subscriptionStatus: orderData.subscriptionStatus,
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                rate: true,
              },
            },
            category: {
              select: {
                id: true,
                category_name: true,
              },
            },
          },
        });

        try {
          const userId = parseInt(session.user.id);
          console.log(`[AFFILIATE_COMMISSION] Checking for referral for user ${userId}, order ${order.id}`);
          
          const moduleSettings = await prisma.moduleSettings.findFirst();
          const affiliateSystemEnabled = moduleSettings?.affiliateSystemEnabled ?? false;
          console.log(`[AFFILIATE_COMMISSION] Affiliate system enabled: ${affiliateSystemEnabled}`);

          if (affiliateSystemEnabled) {
            const referral = await prisma.affiliateReferrals.findUnique({
              where: { referredUserId: userId },
              include: {
                affiliate: {
                  select: {
                    id: true,
                    status: true,
                    commissionRate: true,
                  }
                }
              }
            });

            console.log(`[AFFILIATE_COMMISSION] Referral lookup result:`, {
              found: !!referral,
              affiliateId: referral?.affiliateId,
              affiliateStatus: referral?.affiliate?.status,
              commissionRate: referral?.affiliate?.commissionRate
            });

            if (referral && referral.affiliate && referral.affiliate.status === 'active') {
              const servicePurchaseEarningCount = moduleSettings?.servicePurchaseEarningCount ?? '1';
              const earningLimit = servicePurchaseEarningCount === 'unlimited' ? null : parseInt(servicePurchaseEarningCount, 10);

              const existingCommissionsCount = await prisma.affiliateCommissions.count({
                where: {
                  affiliateId: referral.affiliate.id,
                  referredUserId: userId,
                }
              });

              console.log(`[AFFILIATE_COMMISSION] Commission count check:`, {
                existingCommissionsCount,
                earningLimit: earningLimit ?? 'unlimited',
                canCreateCommission: earningLimit === null || existingCommissionsCount < earningLimit
              });

              const canCreateCommission = earningLimit === null || existingCommissionsCount < earningLimit;

              if (canCreateCommission) {
                const orderAmount = orderData.usdPrice || orderData.price || 0;
                const commissionRate = moduleSettings?.commissionRate ?? 5;
                const commissionAmount = (orderAmount * commissionRate) / 100;

                console.log(`[AFFILIATE_COMMISSION] Commission calculation:`, {
                  orderAmount,
                  commissionRate,
                  commissionAmount,
                  commissionNumber: existingCommissionsCount + 1,
                  limit: earningLimit ?? 'unlimited'
                });

                if (commissionAmount > 0) {
                  const createdCommission = await prisma.affiliateCommissions.create({
                    data: {
                      affiliateId: referral.affiliate.id,
                      referredUserId: userId,
                      orderId: order.id,
                      amount: orderAmount,
                      commissionRate: commissionRate,
                      commissionAmount: commissionAmount,
                      status: 'pending',
                      updatedAt: new Date(),
                    }
                  });

                  console.log(`[AFFILIATE_COMMISSION] ✅ Commission created successfully:`, {
                    commissionId: createdCommission.id,
                    affiliateId: referral.affiliate.id,
                    orderId: order.id,
                    amount: orderAmount,
                    commissionAmount: commissionAmount,
                    status: 'pending',
                    commissionNumber: existingCommissionsCount + 1,
                    limit: earningLimit ?? 'unlimited'
                  });
                } else {
                  console.log(`[AFFILIATE_COMMISSION] ⚠️ Commission amount is 0, skipping creation`);
                }
              } else {
                console.log(`[AFFILIATE_COMMISSION] ⚠️ Commission limit reached for referred user ${userId} (${existingCommissionsCount}/${earningLimit}). Skipping commission for order ${order.id}.`);
              }
            } else {
              console.log(`[AFFILIATE_COMMISSION] ⚠️ No active referral found for user ${userId}`);
            }
          } else {
            console.log(`[AFFILIATE_COMMISSION] ⚠️ Affiliate system is disabled`);
          }
        } catch (affiliateError) {
          console.error('[AFFILIATE_COMMISSION] ❌ Error creating affiliate commission:', affiliateError);
          console.error('[AFFILIATE_COMMISSION] Error stack:', affiliateError instanceof Error ? affiliateError.stack : 'No stack trace');
        }

        createdOrders.push({
          ...order,
          orderIndex,
        });
      }

      await prisma.users.update({
        where: { id: parseInt(session.user.id) },
        data: {
          balance: {
            decrement: totalCost,
          },
          total_spent: {
            increment: totalCost,
          },
        },
      });

      return createdOrders;
    });

    console.log(
      `User ${session.user.email} created ${result.length} Mass Orderss`,
      {
        userId: session.user.id,
        orderCount: result.length,
        totalCost,
        orderIds: result.map((o) => o.id),
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Successfully created ${result.length} orders`,
        data: result,
        summary: {
          ordersCreated: result.length,
          totalCost,
          currency: user.currency,
          remainingBalance: user.balance - totalCost,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating Mass Orderss:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error creating Mass Orderss',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    const moduleSettings = await db.moduleSettings.findFirst();
    const massOrderEnabled = moduleSettings?.massOrderEnabled ?? false;
    if (!massOrderEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: 'Mass Order functionality is currently disabled',
          data: null,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'recent';

    if (type === 'stats') {
      const stats = await db.newOrders.aggregate({
        where: {
          userId: parseInt(session.user.id),
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          price: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            last30Days: {
              totalOrders: stats._count.id,
              totalSpent: stats._sum.price || 0,
            },
          },
        },
        { status: 200 }
      );
    }

    if (type === 'recent') {
      const recentOrders = await db.newOrders.findMany({
        where: {
          userId: parseInt(session.user.id),
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          service: {
            select: {
              name: true,
              rate: true,
            },
          },
          category: {
            select: {
              category_name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      return NextResponse.json(
        {
          success: true,
          data: recentOrders,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid type parameter. Use: recent, templates, or stats',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching Mass Orders data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Authentication required') {
      return NextResponse.json(
        {
          success: false,
          message,
          error: message,
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching Mass Orders data',
        error: message,
      },
      { status: 500 }
    );
  }
}
