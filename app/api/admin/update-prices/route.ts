import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

interface PriceUpdateSettings {
  serviceType: 'all-services' | 'provider-services' | 'manual-services';
  profitPercentage: number;
  providerId?: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      priceSettings: {
        serviceType: 'all-services',
        profitPercentage: 10,
        providerId: ''
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching price settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch price settings: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const { priceSettings }: { priceSettings: PriceUpdateSettings } = await req.json();

    if (!priceSettings) {
      return NextResponse.json(
        {
          error: 'Price settings are required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const { serviceType, profitPercentage, providerId } = priceSettings;

    if (typeof profitPercentage !== 'number' || profitPercentage < 0) {
      return NextResponse.json(
        {
          error: 'Valid profit percentage is required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    let whereClause: any = {
      deletedAt: null,
    };

    switch (serviceType) {
      case 'all-services':
        break;
      case 'provider-services':
        if (!providerId) {
          return NextResponse.json(
            {
              error: 'Provider ID is required for provider services',
              success: false,
              data: null
            },
            { status: 400 }
          );
        }
        whereClause.providerId = parseInt(providerId);
        break;
      case 'manual-services':
        whereClause.OR = [
          { mode: 'manual' },
          { providerId: null }
        ];
        break;
      default:
        return NextResponse.json(
          {
            error: 'Invalid service type',
            success: false,
            data: null
          },
          { status: 400 }
        );
    }

    console.log('Where clause for service query:', JSON.stringify(whereClause, null, 2));

    const servicesToUpdate = await db.services.findMany({
      where: whereClause,
      select: {
        id: true,
        providerPrice: true,
        name: true
      }
    });

    console.log(`Found ${servicesToUpdate.length} services matching criteria`);
    console.log('Sample services:', servicesToUpdate.slice(0, 3));

    let updateCount = 0;
    for (const service of servicesToUpdate) {
      const providerPrice = service.providerPrice || 0;
      const newRate = providerPrice + (providerPrice * profitPercentage / 100);
      
      await db.services.update({
        where: { id: service.id },
        data: {
          percentage: profitPercentage,
          rate: newRate,
          updatedAt: new Date()
        }
      });
      
      updateCount++;
      console.log(`Updated service "${service.name}": providerPrice=${providerPrice}, percentage=${profitPercentage}%, newRate=${newRate}`);
    }

    const updateResult = { count: updateCount };

    console.log(`Updated ${updateResult.count} services with profit percentage: ${profitPercentage}%`);
    console.log('Final response data:', {
      updatedCount: updateResult.count,
      profitPercentage: profitPercentage,
      serviceType: serviceType,
      providerId: providerId || null
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updateResult.count} services with ${profitPercentage}% profit percentage`,
      data: {
        updatedCount: updateResult.count,
        profitPercentage: profitPercentage,
        serviceType: serviceType,
        providerId: providerId || null
      },
      error: null
    });

  } catch (error) {
    console.error('Error updating prices:', error);
    return NextResponse.json(
      {
        error: 'Failed to update prices: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
