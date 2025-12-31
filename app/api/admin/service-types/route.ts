import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { SERVICE_TYPE_CONFIGS } from '@/lib/service-types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceCounts = await prisma.services.groupBy({
      by: ['packageType'],
      _count: {
        id: true,
      },
    });

    const serviceCountMap = new Map(
      serviceCounts.map(item => [item.packageType, item._count.id])
    );

    const serviceTypes = Object.entries(SERVICE_TYPE_CONFIGS).map(([key, config]) => {
      const packageType = parseInt(key);
      const serviceCount = serviceCountMap.get(packageType) || 0;
      
      return {
        id: packageType,
        name: config.name,
        description: config.description,
        serviceCount: serviceCount,
      };
    });

    return NextResponse.json({ data: serviceTypes });
  } catch (error) {
    console.error('Error fetching service types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Service types are predefined and cannot be created via API
  return NextResponse.json(
    { 
      error: 'Service types are predefined and cannot be created. Use the predefined SERVICE_TYPE_CONFIGS.',
      success: false,
      data: null 
    },
    { status: 400 }
  );
}
