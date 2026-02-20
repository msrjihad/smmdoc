import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { services, providerId } = body;

    if (!services || !Array.isArray(services) || !providerId) {
      return NextResponse.json(
        { error: 'Services array and provider ID are required' },
        { status: 400 }
      );
    }

    const providerServiceIds = services
      .map(service => service.id?.toString())
      .filter(id => id);

    if (providerServiceIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          duplicates: [],
          duplicateIds: []
        }
      });
    }

    const existingServices = await db.services.findMany({
      where: {
        providerServiceId: {
          in: providerServiceIds
        },
        providerId: parseInt(providerId),
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        providerServiceId: true,
        createdAt: true,
        refillDays: true,
        refillDisplay: true
      }
    });

    const existingProviderServiceIds = new Set(
      existingServices.map(service => service.providerServiceId)
    );

    const duplicates = services.filter(service => 
      existingProviderServiceIds.has(service.id?.toString())
    );

    const duplicateIds = duplicates.map(service => service.id?.toString());

    console.log(`ðŸ” Duplicate check: Found ${duplicates.length} duplicates out of ${services.length} services`);
    console.log('Duplicate provider service IDs:', duplicateIds);

    const existingServicesMap = new Map(
      existingServices.map(service => [service.providerServiceId, service])
    );

    return NextResponse.json({
      success: true,
      data: {
        duplicates: duplicates,
        duplicateIds: duplicateIds,
        existingServices: existingServices,
        existingServicesMap: Object.fromEntries(existingServicesMap)
      }
    });

  } catch (error) {
    console.error('Error checking for duplicate services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
