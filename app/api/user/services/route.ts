import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { serializeServices } from '@/lib/utils';

async function fetchCurrencyData() {
  try {
    const currencies = await db.currencies.findMany({
      where: { enabled: true },
      select: {
        code: true,
        symbol: true,
        rate: true,
      },
    });
    return { currencies };
  } catch (error) {
    console.error('Error fetching currency data:', error);
    return { currencies: [] };
  }
}

function convertFromUSD(usdAmount: number, targetCurrency: string, currencies: any[]) {
  if (targetCurrency === 'USD') {
    return usdAmount;
  }

  const targetCurrencyData = currencies.find(c => c.code === targetCurrency);
  if (!targetCurrencyData) {
    return usdAmount;
  }

  return usdAmount * targetCurrencyData.rate;
}

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
    const limitParam = searchParams.get('limit') || '50';
    const searchRaw = searchParams.get('search') || '';
    const search = searchRaw ? decodeURIComponent(searchRaw).trim() : '';
    const currency = searchParams.get('currency') || 'USD';
    const provider = searchParams.get('provider') || '';

    const categoryLimit = parseInt(limitParam);
    const categorySkip = (page - 1) * categoryLimit;

    const { currencies } = await fetchCurrencyData();

    let services;
    let paginatedCategories: any;
    let totalCategories;

    if (search) {
      const isNumericSearch = /^\d+$/.test(search);
      
      const searchQuery = {
        where: {
          status: 'active',
          category: {
            hideCategory: 'no',
          },
          AND: [
            ...(provider && provider !== 'All' ? [{
              OR: [
                { providerName: { contains: provider } },
                { providerId: provider === 'Self' ? null : parseInt(provider) || undefined }
              ]
            }] : []),
            {
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
                  category: {
                    category_name: {
                      contains: search,
                    },
                  },
                },
              ].filter(Boolean),
            },
          ].filter(Boolean),
        },
        orderBy: [
          ...(isNumericSearch 
            ? [{ id: 'asc' as any }] 
            : []
          ),
          { createdAt: 'desc' as any },
        ],
        select: {
          id: true,
          name: true,
          rate: true,
          min_order: true,
          max_order: true,
          avg_time: true,
          description: true,
          status: true,
          refill: true,
          cancel: true,
          refillDays: true,
          refillDisplay: true,
          exampleLink: true,
          serviceSpeed: true,
          perqty: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              category_name: true,
            }
          },
          serviceType: {
            select: {
              id: true,
              name: true,
            }
          },
        },
      };
      
      services = await db.services.findMany(searchQuery);
      
      paginatedCategories = [];
      totalCategories = 0;
    } else {
      const showAllCategories = limitParam === 'all';
      
      if (showAllCategories) {
        [paginatedCategories, totalCategories] = await Promise.all([
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
          db.categories.count({
            where: {
              hideCategory: 'no',
            },
          }),
        ]);

        services = await db.services.findMany({
          where: {
            status: 'active',
            AND: [
              ...(provider && provider !== 'All' ? [{
                ...(provider === 'Self' ? {
                  AND: [
                    { providerId: null },
                    { providerName: null }
                  ]
                } : {
                  OR: [
                    { providerName: { contains: provider } },
                    { providerId: parseInt(provider) || undefined }
                  ]
                })
              }] : []),
              {
                category: {
                  hideCategory: 'no',
                },
              },
            ].filter(Boolean),
          },
          orderBy: {
            createdAt: 'desc' as any,
          },
          select: {
            id: true,
            name: true,
            rate: true,
            min_order: true,
            max_order: true,
            avg_time: true,
            description: true,
            status: true,
            refill: true,
            cancel: true,
            refillDays: true,
            refillDisplay: true,
            exampleLink: true,
            serviceSpeed: true,
            perqty: true,
            providerId: true,
            providerName: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                category_name: true,
              }
            },
          },
        });
      } else {
        [paginatedCategories, totalCategories] = await Promise.all([
          db.categories.findMany({
            where: {
              hideCategory: 'no',
            },
            skip: categorySkip,
            take: categoryLimit,
            orderBy: [
              { id: 'asc' as any },
              { position: 'asc' as any },
              { createdAt: 'asc' as any },
            ],
          }),
          db.categories.count({
            where: {
              hideCategory: 'no',
            },
          }),
        ]);

        const categoryIds = paginatedCategories.map((cat: any) => cat.id);

        services = await db.services.findMany({
          where: {
            status: 'active',
            AND: [
              ...(provider && provider !== 'All' ? [{
                ...(provider === 'Self' ? {
                  AND: [
                    { providerId: null },
                    { providerName: null }
                  ]
                } : {
                  OR: [
                    { providerName: { contains: provider } },
                    { providerId: parseInt(provider) || undefined }
                  ]
                })
              }] : []),
              {
                categoryId: {
                  in: categoryIds,
                },
              },
            ].filter(Boolean),
          },
          orderBy: {
            createdAt: 'desc' as any,
          },
          select: {
            id: true,
            name: true,
            rate: true,
            min_order: true,
            max_order: true,
            avg_time: true,
            description: true,
            status: true,
            refill: true,
            cancel: true,
            refillDays: true,
            refillDisplay: true,
            exampleLink: true,
            serviceSpeed: true,
            perqty: true,
            providerId: true,
            providerName: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                category_name: true,
              }
            },
          },
        });
      }
    }



    const servicesWithConvertedPrices = serializeServices(services).map(service => {
      const priceUSD = service.rate;
      const convertedPrice = convertFromUSD(priceUSD, currency, currencies);

      return {
        ...service,
        rate: convertedPrice,
        displayCurrency: currency,
      };
    });

    const uniqueProviders = await db.services.findMany({
      where: {
        status: 'active',
        category: {
          hideCategory: 'no',
        },
      },
      select: {
        providerId: true,
        providerName: true,
      },
      distinct: ['providerId', 'providerName'],
    });

    const providerOptions = [
      { id: 'All', name: 'All Providers' },
      { id: 'Self', name: 'Self' },
      ...uniqueProviders
        .filter(p => p.providerName && p.providerName !== 'All' && p.providerName !== 'Self')
        .map(p => ({
          id: p.providerId?.toString() || p.providerName || '',
          name: p.providerName || 'Unknown Provider'
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    ];

    return NextResponse.json(
      {
        data: servicesWithConvertedPrices || [],
        total: services.length,
        page: search ? 1 : page,
        totalPages: search ? 1 : Math.ceil(totalCategories / categoryLimit),
        totalCategories: search ? 0 : totalCategories,
        currency: currency,
        limit: limitParam,
        allCategories: paginatedCategories || [],
        isSearch: !!search,
        providers: providerOptions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in services API:", error);
    return NextResponse.json(
      {
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
        message: 'Error fetching services',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
