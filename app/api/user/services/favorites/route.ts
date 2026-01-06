import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertBigIntToNumber(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const searchRaw = searchParams.get('search') || '';
    const search = searchRaw ? decodeURIComponent(searchRaw).trim() : '';
    const skip = (page - 1) * limit;

    if (!userIdParam) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(userIdParam);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const favoriteServices = await db.favoriteServices.findMany({
      where: { userId },
      select: { serviceId: true },
    });

    const favoriteServiceIds = favoriteServices.map((fav) => fav.serviceId);
    
    if (favoriteServiceIds.length === 0) {
      return NextResponse.json(
        {
          data: [],
          total: 0,
          page,
          totalPages: 0,
        },
        { status: 200 }
      );
    }
    
    const isNumericSearch = /^\d+$/.test(search);
    
    const searchCondition = search
      ? {
          OR: [
            ...(isNumericSearch 
              ? [{
                  id: {
                    equals: Number(search)
                  }
                }] 
              : []
            ),
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
            {
              category: {
                category_name: {
                  contains: search,
                },
              },
            },
          ].filter(Boolean),
        }
      : {};
    
    const whereClause = {
      id: { in: favoriteServiceIds },
      ...searchCondition,
    };
    


    const [services, total, allCategories] = await Promise.all([
      db.services.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          ...(isNumericSearch 
            ? [{ id: 'asc' as any }] 
            : []
          ),
          { createdAt: 'desc' as any },
        ],
        include: {
          category: true,
        },
      }),
      db.services.count({ where: whereClause }),
      db.categories.findMany({
        where: {
          hideCategory: 'no',
        },
        orderBy: [
          { id: 'asc' as any },
          { position: 'asc' as any },
          { createdAt: 'asc' as any },
        ],
      }),
    ]);
    
    const convertedServices = convertBigIntToNumber(services);
    const convertedTotal = typeof total === 'bigint' ? Number(total) : total;
    const convertedCategories = convertBigIntToNumber(allCategories);
    
    return NextResponse.json(
      {
        data: convertedServices || [],
        total: convertedTotal,
        page,
        totalPages: Math.ceil(convertedTotal / limit),
        allCategories: convertedCategories || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in favorite services API:", error);
    return NextResponse.json(
      {
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
        message: 'Error fetching favorite services',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
