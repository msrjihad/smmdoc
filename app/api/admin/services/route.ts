import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';
import { serializeServices, serializeService } from '@/lib/utils';

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

    // Automatically determine serviceTypeId from packageType using predefined SERVICE_TYPE_CONFIGS
    // Since service types are predefined, we use packageType directly as serviceTypeId
    const finalPackageType = createData.packageType || 1;
    
    // Map packageType to serviceTypeId based on predefined mapping:
    // packageType 1-4, 11-15 map to serviceTypeId 1-9
    const packageTypeToServiceTypeId: Record<number, number> = {
      1: 1,   // Default
      2: 2,   // Package
      3: 3,   // Special Comments
      4: 4,   // Package Comments
      11: 5,  // Auto Likes
      12: 6,  // Auto Views
      13: 7,  // Auto Comments
      14: 8,  // Subscription
      15: 9,  // Limited Auto Likes
    };

    const mappedServiceTypeId = packageTypeToServiceTypeId[finalPackageType];

    if (mappedServiceTypeId) {
      createData.serviceTypeId = mappedServiceTypeId;
      console.log(`Mapped packageType ${finalPackageType} to serviceTypeId ${mappedServiceTypeId}`);
    } else {
      // Default to serviceTypeId 1 (Default) if packageType doesn't match
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

    const serializedService = serializeService(newService);

    return NextResponse.json(
      {
        error: null,
        message: 'Service created successfully',
        data: serializedService,
        success: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating service:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: error?.code,
      meta: error?.meta,
      cause: error?.cause
    });
    
    let errorMessage = 'Failed to create service';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage += ': ' + error.message;
      const prismaError = error as any;
      
      if (error.message.includes('Foreign key constraint') || prismaError?.code === 'P2003') {
        errorMessage = 'Foreign key constraint failed. Please check that the category, service type, or provider exists.';
        statusCode = 400;
      } else if (error.message.includes('Unique constraint') || prismaError?.code === 'P2002') {
        errorMessage = 'A service with this name or identifier already exists.';
        statusCode = 400;
      } else if (error.message.includes('Required') || prismaError?.code === 'P2011') {
        errorMessage = 'Required field is missing. Please check that all required fields are filled.';
        statusCode = 400;
      } else if (prismaError?.code === 'P2001') {
        errorMessage = 'The record you are trying to reference does not exist.';
        statusCode = 404;
      } else if (prismaError?.code === 'P2012') {
        errorMessage = 'A required value is missing.';
        statusCode = 400;
      }
    }
    
    try {
      return NextResponse.json(
        {
          error: errorMessage,
          data: null,
          success: false,
        },
        { status: statusCode }
      );
    } catch (jsonError) {
      console.error("Failed to send error response:", jsonError);
      return new NextResponse(
        JSON.stringify({
          error: errorMessage,
          data: null,
          success: false,
        }),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
}
