import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';
import { serializeServices, serializeService } from '@/lib/utils';
import { sendNewServiceNotification } from '@/lib/notifications/user-notifications';
import { handleApiError, createSuccessResponse } from '@/lib/utils/error-handler';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin or Moderator privileges required.',
          success: false,
          data: null,
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const serviceTypeFilter = searchParams.get('serviceType') || '';
    const packageTypeFilter = searchParams.get('packageType') || '';
    const limit = parseInt(limitParam);

    let deletedAtFilter;
    if (filter === 'trash') {
      deletedAtFilter = { not: null };
    } else if (filter === 'all_with_trash') {
      deletedAtFilter = undefined;
    } else {
      deletedAtFilter = null;
    }

    if (limit >= 500) {
      const whereClause = {
        ...(deletedAtFilter !== undefined && { deletedAt: deletedAtFilter }),
        ...(packageTypeFilter && packageTypeFilter.trim() && !isNaN(Number(packageTypeFilter.trim())) && {
          packageType: Number(packageTypeFilter.trim()),
        }),
        ...(search && search.trim()
          ? {
              OR: [
                {
                  name: {
                    contains: search.trim(),
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: search.trim(),
                    mode: 'insensitive',
                  },
                },
                ...(isNaN(Number(search.trim())) ? [] : [{
                  id: {
                    equals: Number(search.trim()),
                  },
                }]),
                ...(isNaN(Number(search.trim())) ? [] : [{
                  categoryId: {
                    equals: Number(search.trim()),
                  },
                }]),
                {
                  category: {
                    category_name: {
                      contains: search.trim(),
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {})
      };

      console.log('Fetching all services (limit >= 500) with whereClause:', JSON.stringify(whereClause, null, 2));
      
      const services = await db.services.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
        },
      });

      console.log(`Found ${services.length} services (limit >= 500)`);

      const allCategories = await db.categories.findMany({
        where: {
          hideCategory: 'no',
        },
        orderBy: [
          { id: 'asc' },
          { position: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      return NextResponse.json(
        {
          data: serializeServices(services || []),
          total: services.length,
          page: 1,
          limit: services.length,
          totalPages: 1,
          totalCategories: allCategories.length,
          allCategories: allCategories,
          hasNext: false,
          hasPrev: false,
          success: true,
        },
        { status: 200 }
      );
    }

    const categoryLimit = limit;
    const categorySkip = (page - 1) * categoryLimit;
    const [paginatedCategories, totalCategories] = await Promise.all([
      db.categories.findMany({
        skip: categorySkip,
        take: categoryLimit,
        orderBy: [
          { id: 'asc' },
          { position: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      db.categories.count(),
    ]);

    const categoryIds = paginatedCategories.map(cat => cat.id);

    const whereClause = {
      ...(deletedAtFilter !== undefined && { deletedAt: deletedAtFilter }),
      categoryId: {
        in: categoryIds,
      },
      ...(packageTypeFilter && packageTypeFilter.trim() && !isNaN(Number(packageTypeFilter.trim())) && {
        packageType: Number(packageTypeFilter.trim()),
      }),
      ...(search && search.trim()
        ? {
            OR: [
              {
                name: {
                  contains: search.trim(),
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search.trim(),
                  mode: 'insensitive',
                },
              },
              ...(isNaN(Number(search.trim())) ? [] : [{
                id: {
                  equals: Number(search.trim()),
                },
              }]),
              ...(isNaN(Number(search.trim())) ? [] : [{
                categoryId: {
                  equals: Number(search.trim()),
                },
              }]),
              {
                category: {
                  category_name: {
                    contains: search.trim(),
                    mode: 'insensitive',
                  },
                },
              },
              {
                provider: {
                  contains: search.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {})
    };

    console.log('Fetching services with whereClause:', JSON.stringify(whereClause, null, 2));
    
    const services = await db.services.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: true,
      },
    });

    console.log(`Found ${services.length} services`);

    return NextResponse.json(
      {
        data: serializeServices(services || []),
        total: services.length,
        page,
        totalPages: Math.ceil(totalCategories / categoryLimit),
        totalCategories,
        limit: limitParam,
        allCategories: paginatedCategories || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in services API:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
        message: 'Error fetching services',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/admin/services - Request received');
    const session = await getCurrentUser();
    console.log('Session:', session ? `${session.user.email} ${session.user.role}` : 'Not found');
    
    if (!session || session.user.role !== 'admin') {
      console.log('Unauthorized access attempt - Session:', session ? 'exists but not admin' : 'not found');
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    if (!body) {
      return NextResponse.json(
        {
          error: 'Service data is required',
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    console.log('Full request body:', JSON.stringify(body, null, 2));
    console.log('Category ID from body:', body.categoryId, 'Type:', typeof body.categoryId);
    
    if (body.categoryId === undefined || body.categoryId === null || body.categoryId === '') {
      console.log('Category ID validation failed - missing categoryId');
      return NextResponse.json(
        {
          error: 'Category is required. Please select a category.',
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    const {
      categoryId,
      name,
      description,
      rate,
      min_order,
      max_order,
      perqty,
      avg_time,
      updateText,
      serviceTypeId,
      refill,
      cancel,
      refillDays,
      refillDisplay,
      serviceSpeed,
      exampleLink,
      mode,
      orderLink,
      packageType,
      providerId,
      providerServiceId,
      dripfeedEnabled,
      subscriptionMin,
      subscriptionMax,
      subscriptionDelay,
      autoPostsMin,
      autoPostsMax,
      autoDelay,
      customComments,
      isSecret,
    } = body;


    const toBool = (value: unknown): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    const toNumber = (value: unknown, defaultValue: number = 0): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
      }
      return defaultValue;
    };

    const toInt = (value: unknown): number | undefined => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const num = parseInt(value);
        return isNaN(num) ? undefined : num;
      }
      if (value === null || value === undefined || value === '') {
        return undefined;
      }
      return undefined;
    };

    const toRefillValue = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const num = Number(value.trim());
        return isNaN(num) ? null : num;
      }
      return null;
    };

    const createData: any = {
      name: name || '',
      description: description || '',
      rate: toNumber(rate, 0),
      min_order: toNumber(min_order, 0),
      max_order: toNumber(max_order, 0),
      perqty: toNumber(perqty, 1000),
      avg_time: 'Not enough data',
      updateText: updateText || '',
      refill: toBool(refill),
      cancel: toBool(cancel),
      refillDays: toRefillValue(refillDays),
      refillDisplay: toRefillValue(refillDisplay),
      serviceSpeed: serviceSpeed || 'medium',
      exampleLink: (exampleLink !== undefined && exampleLink !== null && exampleLink !== '') ? exampleLink : null,
      mode: mode || 'manual',
      orderLink: orderLink || 'link',
      userId: session.user.id,
      packageType: toNumber(packageType, 1),
      providerId: toInt(providerId) || null,
      providerServiceId: providerServiceId || null,
      dripfeedEnabled: toBool(dripfeedEnabled),
      subscriptionMin: toInt(subscriptionMin) || null,
      subscriptionMax: toInt(subscriptionMax) || null,
      subscriptionDelay: toInt(subscriptionDelay) || null,
      autoPostsMin: toInt(autoPostsMin) || null,
      autoPostsMax: toInt(autoPostsMax) || null,
      autoDelay: toInt(autoDelay) || null,
      customComments: customComments || null,
      isSecret: toBool(isSecret),
    };

    const categoryIdInt = toInt(categoryId);
    console.log('Category ID converted:', categoryIdInt, 'from:', categoryId);
    
    if (categoryIdInt === undefined || categoryIdInt === null) {
      return NextResponse.json(
        {
          error: `Category ID is required. Received: ${categoryId} (${typeof categoryId})`,
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    const categoryExists = await db.categories.findUnique({
      where: { id: categoryIdInt }
    });

    if (!categoryExists) {
      return NextResponse.json(
        {
          error: `Category with ID ${categoryIdInt} does not exist. Please select a valid category.`,
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    createData.categoryId = categoryIdInt;

    const finalPackageType = createData.packageType || 1;
    
    const packageTypeToServiceTypeId: Record<number, number> = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      11: 5,
      12: 6,
      13: 7,
      14: 8,
      15: 9,
    };

    const mappedServiceTypeId = packageTypeToServiceTypeId[finalPackageType];

    if (mappedServiceTypeId) {
      createData.serviceTypeId = mappedServiceTypeId;
      console.log(`Mapped packageType ${finalPackageType} to serviceTypeId ${mappedServiceTypeId}`);
    } else {
      createData.serviceTypeId = 1;
      console.warn(`No mapping found for packageType ${finalPackageType}. Defaulting to serviceTypeId 1.`);
    }

    if (createData.providerId !== null && createData.providerId !== undefined) {
      const providerExists = await db.apiProviders.findUnique({
        where: { id: createData.providerId }
      });

      if (!providerExists) {
        return NextResponse.json(
          {
            error: `Provider with ID ${createData.providerId} does not exist`,
            data: null,
            success: false,
          },
          { status: 400 }
        );
      }
    }

    console.log('Creating service with data:', JSON.stringify(createData, null, 2));
    const newService = await db.services.create({
      data: createData,
    });
    console.log('Service created successfully:', newService.id);

    if (!createData.providerId) {
      sendNewServiceNotification(newService.id, newService.name).catch(err => {
        console.error('Failed to send new service notification:', err);
      });
    }

    const serializedService = serializeService(newService);

    return NextResponse.json(
      createSuccessResponse(serializedService, 'Service created successfully'),
      { status: 201 }
    );
  } catch (error: any) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.statusCode }
    );
  }
}
