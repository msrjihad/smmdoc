import { auth } from '@/auth';
import { convertToUSD } from '@/lib/currency-utils';
import { db } from '@/lib/db';
import { trimSyncLogsToMax } from '@/lib/sync-logs-cleanup';
import { NextRequest, NextResponse } from 'next/server';
import { ApiRequestBuilder, ApiResponseParser, createApiSpecFromProvider } from '@/lib/provider-api-specification';
import { validateProvider } from '@/lib/utils/provider-validator';

const getValidProviders = async () => {
  try {
    return await db.apiProviders.findMany({
      where: {
        status: 'active',
        api_key: { not: '' },
        api_url: { not: '' }
      }
    });
  } catch (error) {
    console.error('Error getting valid providers:', error);
    return [];
  }
};

const DEFAULT_ENDPOINTS = {
  services: "/services",
  balance: "/balance"
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      providerId, 
      syncType = 'all',
      profitMargin = 20 
    } = await req.json();

    let providersToSync = [];

    if (providerId) {
      const validation = await validateProvider(parseInt(providerId));
      if (validation.isValid && validation.provider) {
        providersToSync.push(validation.provider);
      } else {
        return NextResponse.json(
          { error: `Cannot sync: ${validation.error}. Please check your API configuration.`, success: false, data: null },
          { status: 400 }
        );
      }
    } else {
      providersToSync = await getValidProviders();
    }

    if (providersToSync.length === 0) {
      return NextResponse.json(
        { error: 'No active providers found', success: false, data: null },
        { status: 404 }
      );
    }

    const syncResults = [];
    const errors = [];

    const currenciesData = await db.currencies.findMany({
      where: { enabled: true }
    });

    const currencies = currenciesData.map(c => ({
      ...c,
      rate: Number(c.rate)
    }));

    for (const provider of providersToSync) {
      try {
        console.log(`Starting sync for provider: ${provider.name}`);
        
        const apiSpec = createApiSpecFromProvider(provider);
        
        const apiBuilder = new ApiRequestBuilder(
          apiSpec,
          provider.api_url,
          provider.api_key,
          (provider as any).http_method || (provider as any).httpMethod || 'POST'
        );

        const servicesRequest = apiBuilder.buildServicesRequest();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ((provider as any).timeout_seconds || 30) * 1000);
        
        const response = await fetch(servicesRequest.url, {
          method: servicesRequest.method,
          headers: servicesRequest.headers,
          body: servicesRequest.data,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Provider API error: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        
        const responseParser = new ApiResponseParser(apiSpec);
        
        const providerServices = responseParser.parseServicesResponse(responseData);

        if (!Array.isArray(providerServices)) {
          throw new Error('Invalid response format from provider');
        }

        console.log(`Fetched ${providerServices.length} services from ${provider.name}`);

        let existingServices = await db.services.findMany({
          where: {
            updateText: {
              contains: `"providerId":${provider.id}`
            }
          }
        });

        if (existingServices.length === 0) {
          console.log(`No services found with exact providerId:${provider.id}, trying broader search...`);
          
          const servicesByProviderName = await db.services.findMany({
            where: {
              updateText: {
                contains: `"provider":"${provider.name}"`
              }
            }
          });

          const allServices = await db.services.findMany({
            where: {
              updateText: {
                not: null
              }
            },
            take: 10
          });

          console.log(`Found ${servicesByProviderName.length} services by provider name`);
          console.log(`Sample updateText structures:`, allServices.map(s => ({
            id: s.id,
            name: s.name,
            updateText: s.updateText
          })));

          existingServices = servicesByProviderName;
        }

        console.log(`Found ${existingServices.length} existing services for provider ${provider.name}`);

        let syncStats = {
          provider: provider.name,
          providerId: provider.id,
          totalFetched: providerServices.length,
          updated: 0,
          created: 0,
          disabled: 0,
          priceChanges: 0,
          statusChanges: 0,
          errors: [] as any[]
        };

        const existingServiceMap = new Map();
        existingServices.forEach(service => {
          try {
            const providerInfo = JSON.parse(service.updateText || '{}');
            console.log(`Service ${service.id} (${service.name}) updateText:`, providerInfo);
            
            const serviceId = providerInfo.providerServiceId || providerInfo.id || providerInfo.serviceId;
            if (serviceId) {
              existingServiceMap.set(serviceId.toString(), service);
              if (typeof serviceId === 'string' && !isNaN(parseInt(serviceId))) {
                existingServiceMap.set(parseInt(serviceId).toString(), service);
              }
            }
          } catch (error) {
            console.error('Error parsing service provider info:', error);
          }
        });

        console.log(`Created service map with ${existingServiceMap.size} entries`);

        for (const providerService of providerServices) {
          try {
            const providerServiceId = providerService.serviceId;
            console.log(`Processing provider service: ${providerService.name} (ID: ${providerServiceId})`);
            
            const existingService = existingServiceMap.get(providerServiceId?.toString());
            console.log(`Found existing service:`, existingService ? `${existingService.id} (${existingService.name})` : 'None');

            const providerRate = typeof providerService.rate === 'string' ? parseFloat(providerService.rate) : providerService.rate || 0;
            const markupRate = providerRate * (1 + profitMargin / 100);
            const rateUSD = convertToUSD(markupRate, 'USD', currencies);

            if (existingService) {
              const updates: any = {};
              let hasChanges = false;

              const existingProviderInfo = JSON.parse(existingService.updateText || '{}');
              const existingProviderRate = existingProviderInfo.originalRate || 0;

              if (syncType === 'all' || syncType === 'prices') {
                if (Math.abs(providerRate - existingProviderRate) > 0.01) {
                  updates.updateText = JSON.stringify({
                    ...existingProviderInfo,
                    originalRate: providerRate,
                    providerMarkupRate: markupRate,
                    providerRateUSD: rateUSD,
                    lastSynced: new Date().toISOString()
                  });
                  hasChanges = true;
                  syncStats.priceChanges++;
                }
              }

              if (syncType === 'all') {
                if (providerService.name !== existingService.name) {
                  updates.name = providerService.name;
                  hasChanges = true;
                }

                const minValue = typeof providerService.min === 'string' ? parseInt(providerService.min) : providerService.min;
                if (minValue !== existingService.min_order) {
                  updates.min_order = minValue || 100;
                  hasChanges = true;
                }

                const maxValue = typeof providerService.max === 'string' ? parseInt(providerService.max) : providerService.max;
                if (maxValue !== existingService.max_order) {
                  updates.max_order = maxValue || 10000;
                  hasChanges = true;
                }

                const currentProviderInfo = JSON.parse(existingService.updateText || '{}');
                const updatedProviderInfo = {
                  ...currentProviderInfo,
                  provider: provider.name,
                  providerId: provider.id,
                  providerServiceId: providerServiceId,
                  originalRate: providerRate,
                  lastSynced: new Date().toISOString()
                };

                updates.updateText = JSON.stringify(updatedProviderInfo);
                hasChanges = true;
              }

              if (hasChanges) {
                await db.services.update({
                  where: { id: existingService.id },
                  data: updates
                });
                syncStats.updated++;
              }

            } else {
              console.log(`Skipping service ${providerService.name} - not found in database. Use Import page to add new services.`);
            }

          } catch (serviceError) {
            console.error(`Error syncing service ${providerService.name}:`, serviceError);
            syncStats.errors.push({
              service: providerService.name,
              error: serviceError instanceof Error ? serviceError.message : 'Unknown error'
            });
          }
        }

        if ((syncType === 'all' || syncType === 'status') && providerServices.length > 0) {
          const providerServiceIds = new Set();
          
          providerServices.forEach(s => {
            const serviceId = s.serviceId;
            if (serviceId) {
              providerServiceIds.add(serviceId.toString());
              providerServiceIds.add(parseInt(serviceId).toString());
            }
          });

          if (providerServices.length >= 10) {
            for (const [providerServiceId, existingService] of existingServiceMap) {
              if (!providerServiceIds.has(providerServiceId.toString()) && 
                  !providerServiceIds.has(parseInt(providerServiceId).toString()) && 
                  existingService.status === 'active') {
                
                console.log(`Service ${existingService.name} (ID: ${providerServiceId}) not found in provider response, marking as inactive`);
                
                await db.services.update({
                  where: { id: existingService.id },
                  data: { 
                    status: 'inactive',
                    updateText: JSON.stringify({
                      ...JSON.parse(existingService.updateText || '{}'),
                      disabledReason: 'Service no longer available from provider',
                      disabledAt: new Date().toISOString(),
                      lastSynced: new Date().toISOString()
                    })
                  }
                });
                syncStats.disabled++;
                syncStats.statusChanges++;
              }
            }
          } else {
            console.log(`Skipping service status check - only ${providerServices.length} services returned from provider (minimum 10 required)`);
          }
        }

        syncResults.push(syncStats);

      } catch (providerError) {
        console.error(`Error syncing provider ${provider.name}:`, providerError);
        const errorMessage = providerError instanceof Error ? providerError.message : 'Unknown error';
        
        errors.push({
          provider: provider.name,
          error: errorMessage
        });
      }
    }

    const totals = syncResults.reduce((acc, result) => ({
      totalFetched: acc.totalFetched + result.totalFetched,
      updated: acc.updated + result.updated,
      created: acc.created + result.created,
      disabled: acc.disabled + result.disabled,
      priceChanges: acc.priceChanges + result.priceChanges,
      statusChanges: acc.statusChanges + result.statusChanges
    }), {
      totalFetched: 0,
      updated: 0,
      created: 0,
      disabled: 0,
      priceChanges: 0,
      statusChanges: 0
    });

    await trimSyncLogsToMax();

    return NextResponse.json({
      success: true,
      message: `Sync completed for ${syncResults.length} provider(s)`,
      data: {
        syncType,
        providersProcessed: syncResults.length,
        totals,
        results: syncResults,
        errors: errors,
        timestamp: new Date().toISOString()
      },
      error: null
    });

  } catch (error) {
    console.error('Error syncing providers:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync providers: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
