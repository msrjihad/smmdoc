import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeServices = searchParams.get('includeServices') === 'true';

    const serviceTypes = await db.serviceTypes.findMany({
      where: {
        status: 'active',
      },
      orderBy: {
        id: 'asc',
      },
      include: includeServices ? {
        services: {
          where: {
            status: 'active',
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            description: true,
            rate: true,
            min_order: true,
            max_order: true,
            avg_time: true,
            categoryId: true,
            packageType: true,
          },
        },
        _count: {
          select: {
            services: {
              where: {
                status: 'active',
                deletedAt: null,
              },
            },
          },
        },
      } : {
        _count: {
          select: {
            services: {
              where: {
                status: 'active',
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: serviceTypes,
        total: serviceTypes.length,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching service types:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch service types',
        data: null,
        success: false,
      },
      { status: 500 }
    );
  }
}
