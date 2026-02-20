import { auth } from '@/auth';
import { db } from '@/lib/db';
import { trimSyncLogsToMax } from '@/lib/sync-logs-cleanup';
import { NextResponse } from 'next/server';
import { serializeServices } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const moduleSettings = await db.moduleSettings.findFirst();
    const servicesListPublic = moduleSettings?.servicesListPublic ?? true;

    if (!servicesListPublic) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required to access services list' },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    await trimSyncLogsToMax();

    const whereClause: any = {
      status: 'active',
      updateText: {
        not: null,
      },
      ...(search && search.trim()
        ? {
            AND: [
              {
                OR: [
                  {
                    name: {
                      contains: search,
                    },
                  },
                  {
                    description: {
                      contains: search,
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    };
    
    console.log('Fetching services with whereClause:', JSON.stringify(whereClause, null, 2));
    
    const maxFetchLimit = 1000;
    let allServices;
    try {
      allServices = await db.services.findMany({
        where: whereClause,
        take: maxFetchLimit,
        orderBy: {
          updatedAt: 'desc',
        },
      });
      console.log('Database query successful, fetched', allServices.length, 'services');
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      if (dbError instanceof Error) {
        console.error('Database error message:', dbError.message);
        console.error('Database error stack:', dbError.stack);
      }
      throw dbError;
    }
    
    const filteredServices = allServices.filter(
      (service) => service.updateText && service.updateText.trim().length > 0
    );
    
    console.log(`After filtering: ${filteredServices.length} services with valid updateText`);
    
    const actualTotal = filteredServices.length;
    
    const skip = (page - 1) * limit;
    const paginatedServices = filteredServices.slice(skip, skip + limit);
    
    console.log(`Returning page ${page} with ${paginatedServices.length} services (total: ${actualTotal})`);
    
    const serializedServices = serializeServices(paginatedServices);
    
    return NextResponse.json(
      {
        data: serializedServices,
        total: actualTotal,
        page,
        totalPages: Math.ceil(actualTotal / limit),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in getUpdateServices API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    return NextResponse.json(
      {
        message: 'Error fetching services',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
