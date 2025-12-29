import { auth } from '@/auth';
import { db } from '@/lib/db';
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
    const search = searchParams.get('search') || '';

    const whereClause = {
      status: 'active',
      ...(search
        ? {
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
          }
        : {})
    };
    
    const [services] = await Promise.all([
      db.services.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);
    return NextResponse.json(
      {
        data: serializeServices(services),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Error fetching services',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
