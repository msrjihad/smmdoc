import { db } from '@/lib/db';
import { SERVICE_TYPE_CONFIGS } from '@/lib/service-types';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeServices = searchParams.get('includeServices') === 'true';

    const serviceCounts = await db.services.groupBy({
      by: ['serviceTypeId'],
      where: {
        status: 'active',
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const serviceCountMap = new Map(
      serviceCounts.map(item => [item.serviceTypeId, item._count.id])
    );

    const serviceTypes = Object.entries(SERVICE_TYPE_CONFIGS).map(([key, config]) => {
      const serviceTypeId = parseInt(key);
      const serviceCount = serviceCountMap.get(serviceTypeId) || 0;
      
      const result: any = {
        id: config.id,
        name: config.name,
        description: config.description,
        requiresQuantity: config.requiresQuantity,
        requiresLink: config.requiresLink,
        requiresComments: config.requiresComments,
        requiresUsername: config.requiresUsername,
        requiresPosts: config.requiresPosts,
        isSubscription: config.isSubscription,
        isLimited: config.isLimited,
        fixedQuantity: config.fixedQuantity,
        allowsDelay: config.allowsDelay,
        allowsRuns: config.allowsRuns,
        allowsInterval: config.allowsInterval,
        status: 'active',
        _count: {
          services: serviceCount,
        },
      };

      if (includeServices) {
        result.services = [];
      }

      return result;
    });

    if (includeServices) {
      for (const serviceType of serviceTypes) {
        const services = await db.services.findMany({
          where: {
            serviceTypeId: serviceType.id,
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
        });
        serviceType.services = services;
      }
    }

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
