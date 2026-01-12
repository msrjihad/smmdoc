import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

import { handleApiError, createSuccessResponse } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const [completedOrders, activeServices, activeUsers, totalUsers, totalOrders] = await Promise.all([
      db.newOrders.count({
        where: { status: 'completed' },
      }).catch(err => {
        logger.error('Error counting completed orders', err);
        return 0;
      }),
      db.services.count({
        where: { status: 'active', deletedAt: null },
      }).catch(err => {
        logger.error('Error counting active services', err);
        return 0;
      }),
      db.users.count({
        where: { role: 'user', status: 'active' },
      }).catch(err => {
        logger.error('Error counting active users', err);
        return 0;
      }),
      db.users.count().catch(err => {
        logger.error('Error counting total users', err);
        return 0;
      }),
      db.newOrders.count().catch(err => {
        logger.error('Error counting total orders', err);
        return 0;
      }),
    ]);

    const data = {
      completedOrders: completedOrders ?? 0,
      activeServices: activeServices ?? 0,
      activeUsers: activeUsers ?? 0,
      totalUsers: totalUsers ?? 0,
      totalOrders: totalOrders ?? 0,
    };

    return NextResponse.json(createSuccessResponse(data), { status: 200 });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        ...errorResponse,
        data: {
          completedOrders: 0,
          activeServices: 0,
          activeUsers: 0,
          totalUsers: 0,
          totalOrders: 0,
        },
      },
      { status: errorResponse.statusCode }
    );
  }
}