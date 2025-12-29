import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const searchBy = searchParams.get('searchBy') || 'all';
    
    const skip = (page - 1) * limit;
    
    const whereClause: any = {};
    
    if (search) {
      const searchTrimmed = search.trim();
      if (searchBy === 'api_provider') {
        whereClause.serviceName = { contains: searchTrimmed };
      } else if (searchBy === 'service_name') {
        whereClause.serviceName = { contains: searchTrimmed };
      } else {
        whereClause.OR = [
          { serviceName: { contains: searchTrimmed } },
          { action: { contains: searchTrimmed } },
          { changes: { contains: searchTrimmed } }
        ];
      }
    }
    
    const servicesWhereClause: any = {
      status: 'active',
      updateText: {
        not: null,
      },
    };

    if (search) {
      const searchTrimmed = search.trim();
      if (searchBy === 'api_provider') {
      } else if (searchBy === 'service_name') {
        servicesWhereClause.name = { contains: searchTrimmed };
      } else {
        servicesWhereClause.OR = [
          { name: { contains: searchTrimmed } },
          { description: { contains: searchTrimmed } },
        ];
      }
    }

    const allServices = await db.services.findMany({
      where: servicesWhereClause,
      select: {
        id: true,
        name: true,
        updateText: true,
        updatedAt: true,
        providerId: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 1000,
    });

    const apiProviders = await db.apiProviders.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const providerMap = new Map(apiProviders.map(p => [p.id, p.name]));

    let filteredServices = allServices.filter((service) => {
      if (!service.updateText || service.updateText.trim().length === 0) {
        return false;
      }

      try {
        const updateData = JSON.parse(service.updateText || '{}');
        
        if (updateData.updatedBy) {
          return false;
        }

        if (updateData.provider || updateData.providerId || service.providerId) {
          return true;
        }

        return false;
      } catch {
        return service.providerId !== null && service.providerId !== undefined;
      }
    });

    if (search && searchBy === 'api_provider') {
      const searchTrimmed = search.trim().toLowerCase();
      filteredServices = filteredServices.filter((service) => {
        try {
          const updateData = JSON.parse(service.updateText || '{}');
          const providerIdFromUpdate = updateData.providerId;
          const serviceProviderId = service.providerId || providerIdFromUpdate;
          
          if (serviceProviderId && providerMap.has(serviceProviderId)) {
            const providerName = providerMap.get(serviceProviderId);
            return providerName && providerName.toLowerCase().includes(searchTrimmed);
          } else if (updateData.provider) {
            return updateData.provider.toLowerCase().includes(searchTrimmed);
          }
        } catch {
          if (service.providerId && providerMap.has(service.providerId)) {
            const providerName = providerMap.get(service.providerId);
            return providerName && providerName.toLowerCase().includes(searchTrimmed);
          }
        }
        return false;
      });
    }

    const total = filteredServices.length;
    const paginatedServices = filteredServices.slice(skip, skip + limit);

    const formatChanges = (updateText: string): string => {
      try {
        const updateData = JSON.parse(updateText || '{}');

        if (updateData.action === 'created' || updateData.type === 'new_service' || updateData.action === 'create') {
          return 'New service';
        }

        if (updateData.action === 'added' || updateData.type === 'service_added' || updateData.action === 'import') {
          return 'New service';
        }

        const updates: string[] = [];
        let hasRateChange = false;
        let hasStatusChange = false;

        const rateChange = updateData.changes?.rate || updateData.rate;
        if (rateChange && rateChange.from !== undefined && rateChange.to !== undefined) {
          const oldRate = parseFloat(rateChange.from);
          const newRate = parseFloat(rateChange.to);

          const formatRate = (rate: number) => {
            const formatted = rate.toFixed(6);
            return parseFloat(formatted).toString();
          };

          if (newRate > oldRate) {
            updates.push(`Rate increased from $${formatRate(oldRate)} to $${formatRate(newRate)}`);
            hasRateChange = true;
          } else if (newRate < oldRate) {
            updates.push(`Rate decreased from $${formatRate(oldRate)} to $${formatRate(newRate)}`);
            hasRateChange = true;
          }
        }

        const statusChange = updateData.changes?.status || updateData.status;
        if (statusChange && statusChange.from !== undefined && statusChange.to !== undefined) {
          const oldStatus = statusChange.from;
          const newStatus = statusChange.to;
          if (newStatus === 'active' && oldStatus !== 'active') {
            updates.push('Service enabled');
            hasStatusChange = true;
          } else if (newStatus !== 'active' && oldStatus === 'active') {
            updates.push('Service disabled');
            hasStatusChange = true;
          }
        }

        const infoUpdates: string[] = [];

        const minOrderChange = updateData.changes?.min_order || updateData.min_order;
        if (minOrderChange && minOrderChange.from !== undefined && minOrderChange.to !== undefined) {
          infoUpdates.push('min order');
        }

        const maxOrderChange = updateData.changes?.max_order || updateData.max_order;
        if (maxOrderChange && maxOrderChange.from !== undefined && maxOrderChange.to !== undefined) {
          infoUpdates.push('max order');
        }

        const nameChange = updateData.changes?.name || updateData.name;
        if (nameChange && nameChange.from !== undefined && nameChange.to !== undefined) {
          infoUpdates.push('name');
        }

        const descriptionChange = updateData.changes?.description || updateData.description;
        if (descriptionChange && descriptionChange.from !== undefined && descriptionChange.to !== undefined) {
          infoUpdates.push('description');
        }

        const categoryChange = updateData.changes?.categoryId || updateData.changes?.category || updateData.category;
        if (categoryChange && categoryChange.from !== undefined && categoryChange.to !== undefined) {
          infoUpdates.push('category');
        }

        if (infoUpdates.length > 0 && !hasRateChange && !hasStatusChange) {
          updates.push('Service info updated');
        }

        return updates.length > 0 ? updates.join(', ') : 'Service updated';

      } catch (error) {
        const text = updateText || '';
        if (text.toLowerCase().includes('created') || text.toLowerCase().includes('new')) {
          return 'New service';
        }
        if (text.toLowerCase().includes('added') || text.toLowerCase().includes('imported')) {
          return 'Service added';
        }
        if (text.toLowerCase().includes('disabled')) {
          return 'Service disabled';
        }
        if (text.toLowerCase().includes('enabled')) {
          return 'Service enabled';
        }
        return 'Service updated';
      }
    };

    const logs = paginatedServices
      .map((service, index) => {
        let apiProvider = 'Self';
        
        try {
          const updateData = JSON.parse(service.updateText || '{}');
          
          if (updateData.updatedBy) {
            apiProvider = 'Self';
          } else if (updateData.provider || updateData.providerId) {
            const providerIdFromUpdate = updateData.providerId;
            const serviceProviderId = service.providerId || providerIdFromUpdate;
            
            if (serviceProviderId && providerMap.has(serviceProviderId)) {
              apiProvider = providerMap.get(serviceProviderId)!;
            } else if (updateData.provider) {
              apiProvider = updateData.provider;
            }
          } else if (service.providerId && providerMap.has(service.providerId)) {
            apiProvider = providerMap.get(service.providerId)!;
          }
        } catch {
          if (service.providerId && providerMap.has(service.providerId)) {
            apiProvider = providerMap.get(service.providerId)!;
          }
        }

        if (apiProvider === 'Self') {
          return null;
        }

        let changeType: 'added' | 'updated' | 'deleted' | 'error' = 'updated';
        try {
          const updateData = JSON.parse(service.updateText || '{}');
          const action = (updateData.action || '').toLowerCase();
          if (action === 'created' || action === 'create' || action === 'added' || action === 'import') {
            changeType = 'added';
          } else if (action === 'delete' || action === 'deleted' || action === 'remove') {
            changeType = 'deleted';
          } else if (action.includes('error') || action.includes('fail')) {
            changeType = 'error';
          }
        } catch {
        }

        const changesText = formatChanges(service.updateText || '');

        return {
          id: service.id,
          apiProvider,
          serviceName: service.name,
          changes: changesText,
          changeType,
          when: service.updatedAt.toISOString(),
        };
      })
      .filter((log): log is NonNullable<typeof log> => log !== null);
    
    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        }
      },
      error: null
    });
    
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch sync logs: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { action, provider } = body;
    
    if (!action) {
      return NextResponse.json(
        { 
          error: 'Action is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    const syncId = `sync_${Date.now()}`;
    
    
    const syncLog = {
      id: syncId,
      provider: provider || 'All Providers',
      action: action,
      status: 'in_progress',
      message: `${action} initiated`,
      servicesAffected: 0,
      timestamp: new Date().toISOString(),
      duration: null,
      errorDetails: null
    };
    
    console.log(`Admin ${session.user.email} initiated sync:`, {
      action,
      provider,
      syncId,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: `${action} initiated successfully`,
      data: {
        syncId,
        syncLog
      },
      error: null
    });
    
  } catch (error) {
    console.error('Error initiating sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate sync: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { 
          error: 'IDs array is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    const result = await db.services.updateMany({
      where: {
        id: { in: ids.map((id: string | number) => parseInt(String(id))) },
      },
      data: {
        updateText: null,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} sync log(s)`,
      data: {
        deletedCount: result.count,
      },
      error: null
    });
    
  } catch (error) {
    console.error('Error deleting sync logs:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete sync logs: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
