import { auth } from '@/auth';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('API /admin/providers called');
    const session = await getCurrentUser();
    console.log('Session:', session?.user?.email, session?.user?.role);

    if (!session || session.user.role !== 'admin') {
      console.log('No session found or user is not admin:', session?.user?.role);
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'active';

    let configuredProviders: any[] = [];
    try {
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS \`api_providers\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`name\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`api_key\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
          \`api_url\` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          \`status\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'inactive',
          \`is_custom\` boolean DEFAULT FALSE,
          \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`api_providers_name_key\` (\`name\`),
          KEY \`api_providers_status_idx\` (\`status\`),
          KEY \`api_providers_name_idx\` (\`name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      

      let whereClause: any = {};
      
      if (filter === 'active') {
        whereClause = {
          deletedAt: null,
          status: 'active'
        };
      } else if (filter === 'inactive') {
        whereClause = {
          deletedAt: null,
          status: 'inactive'
        };
      } else if (filter === 'trash') {
        whereClause.deletedAt = { not: null };
      } else if (filter === 'all') {
        whereClause = {};
      } else if (filter === 'with-services') {
        whereClause = {
          deletedAt: null,
          status: 'active'
        };
      }

      configuredProviders = await db.apiProviders.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          api_key: true,
          api_url: true,
          http_method: true,
          status: true,
          is_custom: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          current_balance: true,
          balance_last_updated: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`Filter: ${filter}, Where clause:`, whereClause);
      console.log(`Found ${configuredProviders.length} providers from database:`, configuredProviders.map(p => ({ id: p.id, name: p.name, status: p.status, deletedAt: p.deletedAt })));
    } catch (error) {
      console.log('Provider table error:', error);
      configuredProviders = [];
    }

    let providerStatsForFilter: { providerId: number; totalServices: number }[] = [];
    if (filter === 'with-services') {
      providerStatsForFilter = await Promise.all(
        configuredProviders.map(async (cp: any) => {
          try {
            const totalServices = await db.services.count({
              where: { 
                providerId: cp.id,
                ...(cp.deletedAt ? {} : { deletedAt: null })
              }
            });
            return { providerId: cp.id, totalServices };
          } catch {
            return { providerId: cp.id, totalServices: 0 };
          }
        })
      );
    }

    const statsMapForFilter = new Map(providerStatsForFilter.map(s => [s.providerId, s]));

    let allProviders = configuredProviders.map((cp: any) => ({
      value: cp.name,
      label: cp.name,
      name: cp.name,
      description: `Custom provider: ${cp.name}`,
      configured: true,
      status: cp.status,
      id: cp.id,
      apiKey: cp.api_key || '',
      apiUrl: cp.api_url || '',
      httpMethod: cp.http_method || 'POST',
      isCustom: true,
      createdAt: cp.createdAt,
      updatedAt: cp.updatedAt,
      deletedAt: cp.deletedAt,
      currentBalance: cp.current_balance || 0,
      balanceLastUpdated: cp.balance_last_updated,
    }));

    if (filter === 'with-services') {
      allProviders = allProviders.filter(p => (statsMapForFilter.get(p.id)?.totalServices ?? 0) > 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        providers: allProviders,
        total: allProviders.length,
        configured: configuredProviders.length,
        available: 0,
        custom: allProviders.length
      },
      error: null
    });

  } catch (error) {
    console.error('Error getting providers:', error);
    return NextResponse.json(
      {
        error: 'Failed to get providers: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id || !action || action !== 'restore') {
      return NextResponse.json(
        {
          error: 'Valid Provider ID and action=restore are required.',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const providerId = parseInt(id);
    if (isNaN(providerId) || providerId <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid Provider ID format. ID must be a positive number.',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const provider = await db.apiProviders.findUnique({
      where: { id: providerId }
    });

    if (!provider || !provider.deletedAt) {
      return NextResponse.json(
        {
          error: 'Provider not found in trash.',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    await db.apiProviders.update({
      where: { id: providerId },
      data: { 
        deletedAt: null,
        updatedAt: new Date()
      }
    });

    const providerServices = await db.services.findMany({
      where: { 
        providerId: providerId,
        deletedAt: { not: null }
      },
      select: { id: true, categoryId: true }
    });

    const serviceIds = providerServices.map(service => service.id);
    const categoryIds = [...new Set(providerServices.map(service => service.categoryId))];

    if (serviceIds.length > 0) {
      await db.services.updateMany({
        where: { 
          providerId: providerId,
          deletedAt: { not: null }
        },
        data: { deletedAt: null }
      });

      for (const categoryId of categoryIds) {
        const category = await db.categories.findUnique({
          where: { id: categoryId }
        });

        if (category && category.deletedAt) {
          await db.categories.update({
            where: { id: categoryId },
            data: { deletedAt: null }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Provider and all associated services and categories restored successfully',
      data: null,
      error: null
    });

  } catch (error) {
    console.error('Error restoring provider:', error);
    return NextResponse.json(
      {
        error: 'Failed to restore provider: ' + (error instanceof Error ? error.message : 'Unknown error'),
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

    const { 
      customProviderName, 
      apiKey, 
      apiUrl, 
      httpMethod, 
      apiKeyParam,
      actionParam,
      servicesAction,
      servicesEndpoint,
      addOrderAction,
      addOrderEndpoint,
      serviceIdParam,
      linkParam,
      quantityParam,
      runsParam,
      intervalParam,
      statusAction,
      statusEndpoint,
      orderIdParam,
      ordersParam,
      refillAction,
      refillEndpoint,
      refillStatusAction,
      refillIdParam,
      refillsParam,
      cancelAction,
      cancelEndpoint,
      balanceAction,
      balanceEndpoint,
      responseMapping,
      requestFormat,
      responseFormat,
      rateLimitPerMin,
      timeoutSeconds
    } = await req.json();

    console.log('POST /api/admin/providers - Received data:', {
      customProviderName,
      apiKey: apiKey ? '[REDACTED]' : 'undefined/null',
      apiUrl,
      httpMethod
    });

    const providerName = customProviderName;

    if (!providerName || !apiKey) {
      return NextResponse.json(
        {
          error: 'Provider name and API key are required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const providerConfig = {
      value: providerName,
      label: providerName,
      description: `Custom provider: ${providerName}`
    };

    let newProvider: any;
    try {
      const existingProviderByName = await db.apiProviders.findUnique({
        where: { name: providerName }
      });

      if (existingProviderByName) {
        return NextResponse.json(
          {
            error: 'Provider with this name already exists',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }

      if (apiUrl && apiUrl.trim() !== '') {
        const existingProviderByUrl = await db.apiProviders.findFirst({
          where: { 
            api_url: apiUrl.trim()
          }
        });

        if (existingProviderByUrl) {
          return NextResponse.json(
            {
              error: 'Provider with this API URL already exists',
              success: false,
              data: null
            },
            { status: 400 }
          );
        }
      }

      newProvider = await db.apiProviders.create({
        data: {
          name: providerName,
          api_key: apiKey,
          api_url: apiUrl || '',
          http_method: httpMethod || 'POST',
          status: 'inactive',
          is_custom: true,
          api_key_param: apiKeyParam || 'key',
          action_param: actionParam || 'action',
          services_action: servicesAction || 'services',
          services_endpoint: servicesEndpoint || '',
          add_order_action: addOrderAction || 'add',
          add_order_endpoint: addOrderEndpoint || '',
          service_id_param: serviceIdParam || 'service',
          link_param: linkParam || 'link',
          quantity_param: quantityParam || 'quantity',
          runs_param: runsParam || 'runs',
          interval_param: intervalParam || 'interval',
          status_action: statusAction || 'status',
          status_endpoint: statusEndpoint || '',
          order_id_param: orderIdParam || 'order',
          orders_param: ordersParam || 'orders',
          refill_action: refillAction || 'refill',
          refill_endpoint: refillEndpoint || '',
          refill_status_action: refillStatusAction || 'refill_status',
          refill_id_param: refillIdParam || 'refill',
          refills_param: refillsParam || 'refills',
          cancel_action: cancelAction || 'cancel',
          cancel_endpoint: cancelEndpoint || '',
          balance_action: balanceAction || 'balance',
          balance_endpoint: balanceEndpoint || '',
          response_mapping: responseMapping || '',
          request_format: requestFormat || 'form',
          response_format: responseFormat || 'json',
          rate_limit_per_min: rateLimitPerMin ? parseInt(rateLimitPerMin) : null,
          timeout_seconds: timeoutSeconds || 30
        }
      });

      console.log('Provider created successfully:', {
        id: newProvider.id,
        name: newProvider.name,
        api_key: newProvider.api_key ? '[REDACTED]' : 'null',
        api_url: newProvider.api_url
      });
    } catch (error) {
      console.error('Provider creation error:', error);
      return NextResponse.json(
        {
          error: 'Failed to create provider: ' + (error instanceof Error ? error.message : 'Unknown error'),
          success: false,
          data: null
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Provider ${providerConfig.label} added successfully`,
      data: {
        provider: {
          id: newProvider.id,
          status: newProvider.status,
          isCustom: newProvider.is_custom,
          ...providerConfig
        }
      },
      error: null
    });

  } catch (error) {
    console.error('Error adding provider:', error);
    return NextResponse.json(
      {
        error: 'Failed to add provider: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const { id, status, name, apiKey, apiUrl, httpMethod, username, password } = await req.json();

    console.log('PUT /api/admin/providers - Received data:', {
      id,
      status,
      name,
      apiKey: apiKey ? '[REDACTED]' : 'undefined/null',
      apiUrl,
      httpMethod,
      username,
      password: password ? '[REDACTED]' : 'undefined/null'
    });

    if (!id) {
      return NextResponse.json(
        {
          error: 'Provider ID is required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (apiKey !== undefined) updateData.api_key = apiKey;
    if (apiUrl !== undefined) updateData.api_url = apiUrl;
    if (httpMethod !== undefined) updateData.http_method = httpMethod;

    if (status === 'active') {
      const provider = await db.apiProviders.findUnique({
        where: { id: parseInt(id) }
      });

      if (!provider) {
        return NextResponse.json(
          {
            error: 'Provider not found',
            success: false,
            data: null
          },
          { status: 404 }
        );
      }

      const finalApiUrl = updateData.api_url !== undefined ? updateData.api_url : provider.api_url;
      const finalApiKey = updateData.api_key !== undefined ? updateData.api_key : provider.api_key;

      if (!finalApiUrl || finalApiUrl.trim() === '') {
        return NextResponse.json(
          {
            error: 'Cannot activate provider: API URL is required',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }

      if (!finalApiKey || finalApiKey.trim() === '') {
        return NextResponse.json(
          {
            error: 'Cannot activate provider: API Key is required',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }

      try {
        new URL(finalApiUrl);
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Cannot activate provider: Invalid API URL format',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }

    const updatedProvider = await db.apiProviders.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    console.log('Provider updated successfully:', {
      id: updatedProvider.id,
      name: updatedProvider.name,
      api_key: updatedProvider.api_key ? '[REDACTED]' : 'null',
      api_url: updatedProvider.api_url
    });

    return NextResponse.json({
      success: true,
      message: `Provider ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        provider: updatedProvider
      },
      error: null
    });

  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json(
      {
        error: 'Failed to update provider: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const deleteType = searchParams.get('type') || 'permanent';

    if (!id || id === 'null' || id === 'undefined') {
      return NextResponse.json(
        {
          error: 'Valid Provider ID is required. Cannot delete unconfigured provider.',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const providerId = parseInt(id);
    if (isNaN(providerId) || providerId <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid Provider ID format. ID must be a positive number.',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    let message = '';
    
    if (deleteType === 'trash') {
      await db.apiProviders.update({
        where: { id: providerId },
        data: { 
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      const providerServices = await db.services.findMany({
        where: { providerId: providerId },
        select: { id: true, categoryId: true }
      });

      const serviceIds = providerServices.map(service => service.id);
      const categoryIds = [...new Set(providerServices.map(service => service.categoryId))];

      if (serviceIds.length > 0) {
        await db.services.updateMany({
          where: { providerId: providerId },
          data: { deletedAt: new Date() }
        });

        for (const categoryId of categoryIds) {
          const selfCreatedServices = await db.services.count({
            where: { 
              categoryId: categoryId,
              providerId: null,
              deletedAt: null
            }
          });

          if (selfCreatedServices === 0) {
            await db.categories.update({
              where: { id: categoryId },
              data: { deletedAt: new Date() }
            });
          } else {
            await db.categories.update({
              where: { id: categoryId },
              data: { 
                updatedAt: new Date()
              }
            });
          }
        }
      }

      message = 'Provider moved to trash. Categories with self-created services preserved and changed to "Self" provider';
    } else {
      
      const providerServices = await db.services.findMany({
        where: { providerId: providerId },
        select: { id: true, categoryId: true }
      });

      const serviceIds = providerServices.map(service => service.id);
      const categoryIds = [...new Set(providerServices.map(service => service.categoryId))];

      if (serviceIds.length > 0) {
        
        await db.favoriteServices.deleteMany({
          where: { serviceId: { in: serviceIds } }
        });

        await db.cancelRequests.deleteMany({
          where: { 
            order: { 
              serviceId: { in: serviceIds } 
            } 
          }
        });

        await db.refillRequests.deleteMany({
          where: { 
            order: { 
              serviceId: { in: serviceIds } 
            } 
          }
        });

        await db.newOrders.deleteMany({
          where: { serviceId: { in: serviceIds } }
        });

        await db.services.deleteMany({
          where: { providerId: providerId }
        });

        for (const categoryId of categoryIds) {
          const selfCreatedServices = await db.services.count({
            where: { 
              categoryId: categoryId,
              providerId: null,
              deletedAt: null
            }
          });

          if (selfCreatedServices === 0) {
            await db.categories.delete({
              where: { id: categoryId }
            });
          } else {
            await db.categories.update({
              where: { id: categoryId },
              data: { 
                updatedAt: new Date()
              }
            });
          }
        }
      }

      await db.apiProviders.delete({
        where: { id: providerId }
      });

      message = 'Provider permanently deleted. Categories with self-created services preserved and changed to "Self" provider';
    }

    return NextResponse.json({
      success: true,
      message: message,
      data: null,
      error: null
    });

  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete provider: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
