
export const DB_LIMITS = {
  SERVICES_PER_PAGE: 50,
  CATEGORIES_PER_PAGE: 20,
  ORDERS_PER_PAGE: 100,
  USERS_PER_PAGE: 50,
  MAX_BATCH_SIZE: 1000,
} as const;

export const CACHE_SETTINGS = {
  SERVICES_CACHE_TTL: 5 * 60 * 1000,
  CATEGORIES_CACHE_TTL: 10 * 60 * 1000,
  STATS_CACHE_TTL: 2 * 60 * 1000,
} as const;
export const getOptimizedQueryOptions = (page: number = 1, limit: number = 50) => {
  const skip = (page - 1) * limit;

  return {
    skip,
    take: Math.min(limit, DB_LIMITS.MAX_BATCH_SIZE),
  };
};
export const getPaginationData = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
    startIndex: (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, total),
  };
};
export const getServicesWithPagination = async (prisma: any, page: number = 1, categoryId?: number) => {
  const limit = DB_LIMITS.SERVICES_PER_PAGE;
  const { skip, take } = getOptimizedQueryOptions(page, limit);

  const where = categoryId ? { categoryId } : {};

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        minOrder: true,
        maxOrder: true,
        status: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            orders: true,
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    }),
    prisma.service.count({ where })
  ]);

  return {
    services,
    pagination: getPaginationData(total, page, limit)
  };
};
export const getCategoriesWithPagination = async (prisma: any, page: number = 1) => {
  const limit = DB_LIMITS.CATEGORIES_PER_PAGE;
  const { skip, take } = getOptimizedQueryOptions(page, limit);

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        _count: {
          select: {
            services: true,
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    }),
    prisma.category.count()
  ]);

  return {
    categories,
    pagination: getPaginationData(total, page, limit)
  };
};
export const batchUpdateServices = async (prisma: any, serviceIds: number[], updateData: any) => {
  const batchSize = 100;
  const results = [];

  for (let i = 0; i < serviceIds.length; i += batchSize) {
    const batch = serviceIds.slice(i, i + batchSize);
    const result = await prisma.service.updateMany({
      where: {
        id: {
          in: batch
        }
      },
      data: updateData
    });
    results.push(result);
  }

  return results;
};
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
  };
};
export const optimizePrismaConnection = (prisma: any) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const start = Date.now();
          const result = await query(args);
          const end = Date.now();
          if (end - start > 1000) {
            console.warn(`Slow query detected: ${model}.${operation} took ${end - start}ms`);
          }

          return result;
        },
      },
    },
  });
};
