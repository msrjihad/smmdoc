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
          data: null,
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const sanitizedStatus = status && status !== 'all' ? status.trim() : null;
    const sanitizedSearch = search ? search.trim().slice(0, 100) : null;

    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          id: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const { Prisma } = await import('@prisma/client');
    
    let statusFilter = Prisma.empty;
    let searchFilter = Prisma.empty;

    if (sanitizedStatus && ['completed', 'failed', 'pending', 'processing'].includes(sanitizedStatus)) {
      statusFilter = Prisma.sql`AND (
        CASE 
          WHEN COUNT(CASE WHEN o.status = 'completed' THEN 1 END) = COUNT(o.id) THEN 'completed'
          WHEN COUNT(CASE WHEN o.status = 'failed' OR o.status = 'cancelled' THEN 1 END) > 0 THEN 'failed'
          WHEN COUNT(CASE WHEN o.status = 'processing' THEN 1 END) > 0 THEN 'processing'
          ELSE 'pending'
        END
      ) = ${sanitizedStatus}`;
    }

    if (sanitizedSearch) {
      const searchPattern = `%${sanitizedSearch}%`;
      searchFilter = Prisma.sql`AND (u.email LIKE ${searchPattern} OR u.name LIKE ${searchPattern})`;
    }

    const massOrdersRaw = await db.$queryRaw`
      SELECT 
        u.id as userId,
        u.name as userName,
        u.email as userEmail,
        DATE_TRUNC('minute', o.createdAt) as orderBatch,
        COUNT(o.id) as totalOrders,
        SUM(o.price) as totalCost,
        o.currency,
        MIN(o.createdAt) as createdAt,
        ARRAY_AGG(o.id) as orderIds,
        CASE 
          WHEN COUNT(CASE WHEN o.status = 'completed' THEN 1 END) = COUNT(o.id) THEN 'completed'
          WHEN COUNT(CASE WHEN o.status = 'failed' OR o.status = 'cancelled' THEN 1 END) > 0 THEN 'failed'
          WHEN COUNT(CASE WHEN o.status = 'processing' THEN 1 END) > 0 THEN 'processing'
          ELSE 'pending'
        END as status
      FROM "neworder" o
      JOIN "User" u ON o.userId = u.id
      WHERE 1=1
        ${statusFilter}
        ${searchFilter}
      GROUP BY u.id, u.name, u.email, DATE_TRUNC('minute', o.createdAt), o.currency
      HAVING COUNT(o.id) > 1
      ORDER BY MIN(o.createdAt) DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    let countSearchFilter = Prisma.empty;

    if (sanitizedSearch) {
      const searchPattern = `%${sanitizedSearch}%`;
      countSearchFilter = Prisma.sql`AND (u.email LIKE ${searchPattern} OR u.name LIKE ${searchPattern})`;
    }

    const totalCountRaw = await db.$queryRaw`
      SELECT COUNT(*) as total
      FROM (
        SELECT 
          u.id as userId,
          DATE_TRUNC('minute', o.createdAt) as orderBatch
        FROM "neworder" o
        JOIN "User" u ON o.userId = u.id
        WHERE 1=1
          ${countSearchFilter}
        GROUP BY u.id, DATE_TRUNC('minute', o.createdAt)
        HAVING COUNT(o.id) > 1
      ) as mass_orders
    `;

    const totalCount = Number((totalCountRaw as any)[0]?.total || 0);
    const totalPages = Math.ceil(totalCount / limit);

    const massOrders = (massOrdersRaw as any[]).map((row) => ({
      id: `${row.userid}-${new Date(row.orderbatch).getTime()}`,
      userId: row.userid,
      user: {
        name: row.username,
        email: row.useremail,
      },
      totalOrders: Number(row.totalorders),
      totalCost: Number(row.totalcost),
      currency: row.currency,
      createdAt: row.createdat,
      status: row.status,
      orderIds: row.orderids,
    }));

    const stats = await db.$queryRaw`
      SELECT 
        COUNT(DISTINCT CONCAT(userId, DATE_TRUNC('minute', createdAt))) as totalMassOrders,
        SUM(CASE WHEN mass_order_count > 1 THEN mass_order_count ELSE 0 END) as totalOrdersInMass,
        SUM(CASE WHEN mass_order_count > 1 THEN total_cost ELSE 0 END) as totalRevenue,
        COUNT(CASE WHEN status = 'pending' AND mass_order_count > 1 THEN 1 END) as pendingMassOrders
      FROM (
        SELECT 
          userId,
          DATE_TRUNC('minute', createdAt) as orderBatch,
          COUNT(id) as mass_order_count,
          SUM(price) as total_cost,
          CASE 
            WHEN COUNT(CASE WHEN status = 'completed' THEN 1 END) = COUNT(id) THEN 'completed'
            WHEN COUNT(CASE WHEN status = 'failed' OR status = 'cancelled' THEN 1 END) > 0 THEN 'failed'
            WHEN COUNT(CASE WHEN status = 'processing' THEN 1 END) > 0 THEN 'processing'
            ELSE 'pending'
          END as status
        FROM "neworder"
        GROUP BY userId, DATE_TRUNC('minute', createdAt)
      ) as grouped_orders
    `;

    const statsData = (stats as any)[0] || {};

    return NextResponse.json({
      success: true,
      data: massOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        totalMassOrders: Number(statsData.totalmassorders || 0),
        totalOrdersInMass: Number(statsData.totalordersinmass || 0),
        totalRevenue: Number(statsData.totalrevenue || 0),
        pendingMassOrders: Number(statsData.pendingmassorders || 0),
      },
      error: null,
    });
  } catch (error) {
    console.error('Error fetching Mass Orderss:', error);
    return NextResponse.json(
      {
        error: 'Error fetching Mass Orderss',
        success: false,
        data: null,
      },
      { status: 500 }
    );
  }
}
