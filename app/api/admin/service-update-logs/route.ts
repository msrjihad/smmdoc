import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null,
        },
        { status: 401 }
      );
    }

    const moduleSettings = await db.moduleSettings.findFirst();
    const serviceUpdateLogsEnabled = moduleSettings?.serviceUpdateLogsEnabled ?? true;

    if (!serviceUpdateLogsEnabled) {
      return NextResponse.json({
        success: true,
        data: {
          logs: [],
          total: 0,
          message: 'Service update logs are currently disabled'
        },
        error: null,
      });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const serviceId = url.searchParams.get('serviceId');
    const adminId = url.searchParams.get('adminId');
    const action = url.searchParams.get('action');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (serviceId) {
      where.serviceId = parseInt(serviceId);
    }

    if (adminId) {
      where.adminId = parseInt(adminId);
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      db.serviceUpdateLogs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.serviceUpdateLogs.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      error: null,
    });

  } catch (error) {
    console.error('Error fetching service update logs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch service update logs: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null,
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { olderThanDays = 30 } = body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await db.serviceUpdateLogs.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Admin ${session.user.email} cleared ${result.count} service update logs older than ${olderThanDays} days`);

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
        cutoffDate,
      },
      message: `Successfully deleted ${result.count} old service update logs`,
      error: null,
    });

  } catch (error) {
    console.error('Error clearing service update logs:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear service update logs: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null,
      },
      { status: 500 }
    );
  }
}
