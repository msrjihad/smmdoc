import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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

    console.log('Admin cancel requests API called');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || '';

    console.log('Query params:', { page, limit, status, search });

    const statusFilter: any = {};
    const searchFilter: any = {};

    if (status && status !== 'all') {
      if (status === 'approved') {
        statusFilter.OR = [
          { status: 'approved' },
          { status: 'pending', order: { status: { in: ['cancelled', 'canceled'] } } }
        ];
      } else {
        statusFilter.status = status;
      }
    }

    if (search) {
      const searchNumber = parseInt(search);
      searchFilter.OR = [
        ...(isNaN(searchNumber) ? [] : [{
          order: { id: searchNumber }
        }]),
        {
          user: {
            email: { contains: search, mode: 'insensitive' }
          }
        },
        {
          user: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    const whereCondition: any =
      Object.keys(statusFilter).length > 0 && Object.keys(searchFilter).length > 0
        ? { AND: [statusFilter, searchFilter] }
        : Object.keys(statusFilter).length > 0
          ? statusFilter
          : Object.keys(searchFilter).length > 0
            ? searchFilter
            : {};

    console.log('Prisma where condition:', JSON.stringify(whereCondition, null, 2));

    const cancelRequestsWithRelations = await db.cancelRequests.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        order: {
          include: {
            service: true,
            category: true
          }
        },
        user: true
      }
    });

    console.log(`Found ${cancelRequestsWithRelations.length} cancel requests from database`);
    
    if (cancelRequestsWithRelations.length > 0) {
      cancelRequestsWithRelations.forEach((req, index) => {
        console.log(`Request ${index + 1}:`, {
          id: req.id,
          orderId: req.orderId,
          userId: req.userId,
          status: req.status,
          hasOrder: !!req.order,
          hasUser: !!req.user,
          orderIdFromRelation: req.order?.id,
          userIdFromRelation: req.user?.id,
          createdAt: req.createdAt
        });
      });
    } else {
      const totalAllRequests = await db.cancelRequests.count({});
      console.log(`Total cancel requests in database (no filters): ${totalAllRequests}`);
      
      if (totalAllRequests > 0) {
        const sampleRequests = await db.cancelRequests.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderId: true,
            userId: true,
            status: true,
            createdAt: true
          }
        });
        console.log('Sample of all cancel requests in DB:', sampleRequests);
      }
    }

    const total = await db.cancelRequests.count({
      where: whereCondition
    });

    console.log(`Total cancel requests matching criteria: ${total}`);

    const requestsWithMissingRelations = cancelRequestsWithRelations.filter(
      (request) => !request.order || !request.user
    );
    
    if (requestsWithMissingRelations.length > 0) {
      console.warn(`Warning: ${requestsWithMissingRelations.length} requests have missing relations:`, 
        requestsWithMissingRelations.map(r => ({ id: r.id, orderId: r.orderId, userId: r.userId }))
      );
    }

    const transformedRequests = cancelRequestsWithRelations
      .filter((request): request is typeof request & { order: NonNullable<typeof request.order>, user: NonNullable<typeof request.user> } => {
        if (!request.order) {
          console.error(`Request ${request.id} has no order relation (orderId: ${request.orderId})`);
          return false;
        }
        if (!request.user) {
          console.error(`Request ${request.id} has no user relation (userId: ${request.userId})`);
          return false;
        }
        return true;
      })
      .map((request) => {
        const order = request.order!;
        const user = request.user!;
        
        const isSelfService = !order.service.providerId && !order.service.providerName;
        const seller = isSelfService ? 'Self' : (order.service.providerName || 'Unknown');
        
        const orderStatus = order.status?.toLowerCase() || '';
        const isOrderCancelled = orderStatus === 'cancelled' || orderStatus === 'canceled';
        const cancelRequestStatus = isOrderCancelled && request.status === 'pending' 
          ? 'approved' 
          : request.status;
        
        return {
          id: request.id,
          order: {
            id: order.id,
            service: {
              id: order.service.id,
              name: order.service.name,
              rate: Number(order.service.rate),
              providerName: order.service.providerName || null,
              providerId: order.service.providerId || null
            },
            category: {
              id: order.category.id,
              category_name: order.category.category_name
            },
            qty: Number(order.qty),
            price: Number(order.price),
            charge: Number(order.charge || order.price),
            link: order.link,
            status: order.status,
            createdAt: order.createdAt.toISOString(),
            seller: seller
          },
          user: {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            username: user.email?.split('@')[0],
            currency: user.currency || 'USD'
          },
          reason: request.reason,
          status: cancelRequestStatus,
          requestedAt: request.createdAt.toISOString(),
          processedAt: request.processedAt?.toISOString(),
          processedBy: request.processedBy,
          refundAmount: Number(request.refundAmount || order.price),
          adminNotes: request.adminNotes
        };
      });

    if (transformedRequests.length > 0) {
      console.log('Transformed requests sample:', JSON.stringify(transformedRequests[0], null, 2));
    } else {
      console.log('No cancel requests found after transformation');
    }

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    console.log(`Returning ${transformedRequests.length} transformed cancel requests, total in DB: ${total}`);

    return NextResponse.json({
      success: true,
      data: transformedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching cancel requests:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cancel requests: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      { status: 500 }
    );
  }
}
