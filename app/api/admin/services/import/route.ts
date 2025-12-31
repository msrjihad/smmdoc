import { auth } from '@/auth';
import { db } from '@/lib/db';
import { convertToUSD } from '@/lib/currency-utils';
import { NextRequest, NextResponse } from 'next/server';

const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = API_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`❌ Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

const checkUrlReachability = async (url: string): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD' }, 5000);
    return response.ok;
  } catch {
    return false;
  }
};

const createProviderConfig = (provider: any) => {
  return {
    name: provider.name,
    baseUrl: provider.api_url,
    apiKey: provider.api_key,
    endpoints: JSON.parse(provider.endpoints || '{}'),
    headers: JSON.parse(provider.headers || '{}')
  };
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { providerId, selectedServices, action, categories, page, limit } = body;

    if (action === 'services' && providerId && categories) {
      try {
        console.log('🔥 Services request via POST:', { providerId, categories, page, limit });

        const provider = await db.apiProviders.findUnique({
          where: { id: parseInt(providerId) }
        });

        if (!provider) {
          console.log('❌ Provider not found:', providerId);
          return NextResponse.json(
            { error: 'Provider not found', success: false, data: null },
            { status: 404 }
          );
        }

        console.log('✅ Provider found:', provider.name);

        const providerConfig = createProviderConfig(provider);
        console.log('🔧 Using dynamic config for provider:', provider.name);

        let providerServices = null;
        const categoriesArray = Array.isArray(categories) ? categories : categories.split(',').map((c: string) => c.trim());
        console.log('📋 Requested categories:', categoriesArray);

        const httpMethod = provider.http_method || 'POST';
        const baseUrl = providerConfig.baseUrl;
        
        console.log(`🌐 Using HTTP method: ${httpMethod} for provider: ${provider.name}`);

        try {
          console.log(`🌐 Fetching services using ${httpMethod} method`);
          
          const response = await retryApiCall(async () => {
            if (httpMethod.toUpperCase() === 'POST') {
              const formData = new FormData();
              formData.append(provider.api_key_param || 'key', providerConfig.apiKey);
              formData.append(provider.action_param || 'action', 'services');
              
              return await fetchWithTimeout(baseUrl, {
                method: 'POST',
                body: formData
              });
            } else {
              const servicesUrl = `${baseUrl}?${provider.api_key_param || 'key'}=${encodeURIComponent(providerConfig.apiKey)}&${provider.action_param || 'action'}=services`;
              return await fetchWithTimeout(servicesUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  ...providerConfig.headers
                }
              });
            }
          });

          if (response.ok) {
            const data = await response.json();
            providerServices = Array.isArray(data) ? data : (data.services || data.data || data);
            console.log(`✅ ${httpMethod} method successful, got ${Array.isArray(providerServices) ? providerServices.length : 'unknown'} services`);
          }
        } catch (error) {
          console.error(`❌ ${httpMethod} method failed for ${baseUrl}:`, error);
        }

        if (!providerServices) {
          const alternativeMethod = httpMethod.toUpperCase() === 'POST' ? 'GET' : 'POST';
          try {
            console.log(`🌐 Trying alternative ${alternativeMethod} method`);
            
            const response = await retryApiCall(async () => {
              if (alternativeMethod === 'POST') {
                const formData = new FormData();
                formData.append(provider.api_key_param || 'key', providerConfig.apiKey);
                formData.append(provider.action_param || 'action', 'services');
                
                return await fetchWithTimeout(baseUrl, {
                  method: 'POST',
                  body: formData
                });
              } else {
                const servicesUrl = `${baseUrl}?${provider.api_key_param || 'key'}=${encodeURIComponent(providerConfig.apiKey)}&${provider.action_param || 'action'}=services`;
                return await fetchWithTimeout(servicesUrl, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
              }
            });

            if (response.ok) {
              const data = await response.json();
              providerServices = Array.isArray(data) ? data : (data.services || data.data || data);
              console.log(`✅ ${alternativeMethod} method successful, got ${Array.isArray(providerServices) ? providerServices.length : 'unknown'} services`);
            }
          } catch (error) {
            console.error(`❌ ${alternativeMethod} method failed for ${baseUrl}:`, error);
          }
        }

        if (!providerServices || !Array.isArray(providerServices)) {
          console.log('❌ No services fetched from provider:', {
            providerServices: providerServices ? 'exists but not array' : 'null/undefined',
            type: typeof providerServices,
            isArray: Array.isArray(providerServices)
          });
          return NextResponse.json(
            { error: 'Failed to fetch services from provider', success: false, data: null },
            { status: 500 }
          );
        }

        console.log(`✅ Fetched ${providerServices.length} services from ${provider.name}`);
        
        console.log('🔍 Sample services structure:', JSON.stringify(providerServices.slice(0, 3), null, 2));
        
        if (providerServices.length > 0) {
          const firstService = providerServices[0];
          console.log('🔍 All fields in first service:', Object.keys(firstService));
          console.log('🔍 RAW PROVIDER SERVICE DATA:');
          console.log('🔍 First service all fields:', firstService);
          console.log('🔍 First service complete data:', JSON.stringify(firstService, null, 2));
          
          console.log('🔍 FIELD ANALYSIS:');
          console.log('  - description:', firstService.description);
          console.log('  - desc:', firstService.desc);
          console.log('  - details:', firstService.details);
          console.log('  - info:', firstService.info);
          console.log('  - refill:', firstService.refill, typeof firstService.refill);
          console.log('  - cancel:', firstService.cancel, typeof firstService.cancel);
          console.log('  - refillable:', firstService.refillable);
          console.log('  - cancelable:', firstService.cancelable);
          console.log('  - can_refill:', firstService.can_refill);
          console.log('  - can_cancel:', firstService.can_cancel);
          
          const serviceName = firstService.name || '';
          const hasRefillInName = serviceName.toLowerCase().includes('refill');
          const hasCancelInName = serviceName.toLowerCase().includes('cancel');
          console.log('🔍 NAME ANALYSIS:');
          console.log('  - Service name:', serviceName);
          console.log('  - Has REFILL in name:', hasRefillInName);
          console.log('  - Has CANCEL in name:', hasCancelInName);
        }

        const { ApiResponseParser, createApiSpecFromProvider } = await import('@/lib/provider-api-specification');
        const apiSpec = createApiSpecFromProvider(provider);
        const responseParser = new ApiResponseParser(apiSpec);
        
        let parsedServices;
        try {
          parsedServices = responseParser.parseServicesResponse(providerServices);
          console.log(`✅ Successfully parsed ${parsedServices.length} services using API specification`);
        } catch (parseError) {
          console.warn('⚠️ API specification parsing failed, falling back to manual parsing:', parseError);
          parsedServices = providerServices.map((service: any) => ({
            serviceId: service.service || service.id,
            name: service.name,
            type: service.type || 'Default',
            category: service.category || 'Uncategorized',
            rate: parseFloat(service.rate || service.price || '0'),
            min: parseInt(service.min || '1'),
            max: parseInt(service.max || '10000'),
            description: service.desc || service.description || service.details || service.info || '',
            refill: service.refill === true || service.refill === 1 || service.refill === '1' || service.refill === 'true' || 
                   service.refillable === true || service.refillable === 1 || service.refillable === '1' || service.refillable === 'true' ||
                   service.can_refill === true || service.can_refill === 1 || service.can_refill === '1' || service.can_refill === 'true' ||
                   false,
            cancel: service.cancel === true || service.cancel === 1 || service.cancel === '1' || service.cancel === 'true' || 
                   service.cancelable === true || service.cancelable === 1 || service.cancelable === '1' || service.cancelable === 'true' ||
                   service.can_cancel === true || service.can_cancel === 1 || service.can_cancel === '1' || service.can_cancel === 'true' ||
                   false
          }));
        }

        const filteredServices = parsedServices.filter((service: any) => {
          const serviceCategory = service.category?.toLowerCase() || '';
          return categoriesArray.some((cat: string) => 
            serviceCategory.includes(cat.toLowerCase()) || 
            cat.toLowerCase().includes(serviceCategory)
          );
        });

        console.log(`🔍 Filtered to ${filteredServices.length} services for categories: ${categoriesArray.join(', ')}`);

        const formattedServices = filteredServices.map((service: any) => {
          console.log(`🔍 FORMATTING SERVICE: ${service.name}`);
          console.log('  - Raw service data:', service);
          console.log('  - Description field:', service.description);
          console.log('  - Refill field:', service.refill);
          console.log('  - Cancel field:', service.cancel);
          
          const serviceName = service.name || '';
          const description = service.description || 
                             service.desc || 
                             service.details || 
                             service.info || 
                             serviceName;
          
          let refillStatus = false;
          if (service.refill !== undefined) {
            refillStatus = service.refill === true || service.refill === 1 || service.refill === '1' || service.refill === 'true';
          } else if (service.refillable !== undefined) {
            refillStatus = service.refillable === true || service.refillable === 1 || service.refillable === '1' || service.refillable === 'true';
          } else if (service.can_refill !== undefined) {
            refillStatus = service.can_refill === true || service.can_refill === 1 || service.can_refill === '1' || service.can_refill === 'true';
          }
          
          let cancelStatus = false;
          if (service.cancel !== undefined) {
            cancelStatus = service.cancel === true || service.cancel === 1 || service.cancel === '1' || service.cancel === 'true';
          } else if (service.cancelable !== undefined) {
            cancelStatus = service.cancelable === true || service.cancelable === 1 || service.cancelable === '1' || service.cancelable === 'true';
          } else if (service.can_cancel !== undefined) {
            cancelStatus = service.can_cancel === true || service.can_cancel === 1 || service.can_cancel === '1' || service.can_cancel === 'true';
          }
          
          const formatted = {
            id: service.serviceId || service.service || service.id,
            name: service.name,
            description: description,
            category: service.category,
            rate: service.rate || 0,
            currency: service.currency || 'USD',
            min: service.min || 1,
            max: service.max || 10000,
            type: service.type || 'Default',
            refill: refillStatus,
            cancel: cancelStatus
          };
          
          console.log('  - Formatted result:', formatted);
          return formatted;
        });

        console.log(`✅ Returning ${formattedServices.length} formatted services`);

        return NextResponse.json({
          success: true,
          data: {
            services: formattedServices,
            pagination: {
              total: formattedServices.length,
              page: 1,
              totalPages: 1,
              hasMore: false
            },
            provider: provider.name
          },
          error: null
        });

      } catch (error) {
        console.error('❌ Error in services request:', error);
        return NextResponse.json(
          {
            error: `Failed to fetch services: ${error instanceof Error ? error.message : 'Unknown error'}`,
            success: false,
            data: null
          },
          { status: 500 }
        );
      }
    }

    if (selectedServices && Array.isArray(selectedServices)) {
      return NextResponse.json(
        { error: 'Services import should use PUT method' },
        { status: 405 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Import error:', error);
    return NextResponse.json(
      { error: 'Import failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('🔥 Import API GET called');
    
    const session = await auth();
    console.log('🔥 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email
    });

    if (!session?.user || session.user.role !== 'admin') {
      console.log('❌ Unauthorized access - no session or not admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const action = searchParams.get('action');
    const categories = searchParams.get('categories');

    if (action === 'categories' && providerId) {
      try {
        console.log('🔥 Categories request for provider:', providerId);
        console.log('🔥 Session user:', session?.user?.email, 'Role:', session?.user?.role);

        const provider = await db.apiProviders.findUnique({
          where: { id: parseInt(providerId) }
        });

        if (!provider) {
          console.log('❌ Provider not found:', providerId);
          return NextResponse.json(
            { error: 'Provider not found', success: false, data: null },
            { status: 404 }
          );
        }

        console.log('✅ Provider found:', provider.name);
        console.log('🔧 Provider details:', {
          id: provider.id,
          name: provider.name,
          api_url: provider.api_url,
          http_method: provider.http_method,
          status: provider.status,
          endpoints: provider.endpoints,
          headers: provider.headers
        });

        const providerConfig = createProviderConfig(provider);
        console.log('🔧 Using dynamic config for provider:', provider.name);

        let providerServices = null;
        const endpoints = providerConfig.endpoints;
        const baseUrl = providerConfig.baseUrl;
        const httpMethod = provider.http_method || 'POST';

        console.log('🔍 Available endpoints:', endpoints);
        console.log('🌐 Base URL:', baseUrl);
        console.log(`🌐 Using HTTP method: ${httpMethod} for provider: ${provider.name}`);

        if (endpoints.categories) {
          try {
            const categoriesUrl = `${baseUrl}${endpoints.categories}`;
            console.log(`🌐 Fetching from categories endpoint: ${categoriesUrl}`);
            
            const response = await retryApiCall(async () => {
              if (httpMethod.toUpperCase() === 'POST') {
                const formData = new FormData();
                formData.append(provider.api_key_param || 'key', providerConfig.apiKey);
                formData.append(provider.action_param || 'action', 'categories');
                
                return await fetchWithTimeout(categoriesUrl, {
                  method: 'POST',
                  body: formData
                });
              } else {
                const url = `${categoriesUrl}?${provider.api_key_param || 'key'}=${encodeURIComponent(providerConfig.apiKey)}&${provider.action_param || 'action'}=categories`;
                return await fetchWithTimeout(url, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    ...providerConfig.headers
                  }
                });
              }
            });

            if (response.ok) {
              const data = await response.json();
              const categories = data.categories || data.data || data;
              
              if (Array.isArray(categories)) {
                console.log(`✅ Categories endpoint successful, got ${categories.length} categories`);
                
                const formattedCategories = categories.map((cat, index) => {
                  if (typeof cat === 'string') {
                    return {
                      id: `cat_${index + 1}`,
                      name: cat,
                      servicesCount: 0,
                      selected: false
                    };
                  } else {
                    return {
                      id: cat.id || `cat_${index + 1}`,
                      name: cat.name || cat.category || cat,
                      servicesCount: cat.servicesCount || cat.count || 0,
                      selected: false
                    };
                  }
                });
                
                return NextResponse.json({
                  success: true,
                  data: {
                    categories: formattedCategories,
                    total: formattedCategories.length,
                    provider: provider.name
                  },
                  error: null
                });
              }
            }
          } catch (error) {
            console.error(`❌ Categories endpoint failed for ${baseUrl}:`, error);
          }
        }

        if (!providerServices) {
          try {
            console.log(`🌐 Trying standard SMM panel API format with ${httpMethod} method`);
            
            const response = await retryApiCall(async () => {
              if (httpMethod.toUpperCase() === 'POST') {
                const formData = new FormData();
                formData.append(provider.api_key_param || 'key', providerConfig.apiKey);
                formData.append(provider.action_param || 'action', 'services');
                
                return await fetchWithTimeout(baseUrl, {
                  method: 'POST',
                  body: formData
                });
              } else {
                const servicesUrl = `${baseUrl}?${provider.api_key_param || 'key'}=${encodeURIComponent(providerConfig.apiKey)}&${provider.action_param || 'action'}=services`;
                return await fetchWithTimeout(servicesUrl, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    ...providerConfig.headers
                  }
                });
              }
            });

            if (response.ok) {
              const data = await response.json();
              providerServices = Array.isArray(data) ? data : (data.services || data.data || data);
              console.log(`✅ Standard ${httpMethod} method successful, got ${Array.isArray(providerServices) ? providerServices.length : 'unknown'} services`);
            }
          } catch (error) {
            console.error(`❌ Standard ${httpMethod} method failed for ${baseUrl}:`, error);
          }
        }

        if (!providerServices || !Array.isArray(providerServices)) {
          console.log('❌ No services fetched from provider:', {
            providerServices: providerServices ? 'exists but not array' : 'null/undefined',
            type: typeof providerServices,
            isArray: Array.isArray(providerServices)
          });
          
          return NextResponse.json(
            { 
              error: 'Failed to fetch services from provider. Please check the provider API configuration and ensure the endpoint is accessible.', 
              success: false, 
              data: null 
            },
            { status: 500 }
          );
        }

        const categoryMap = new Map();
        
        providerServices.forEach((service: any) => {
          const categoryName = service.category;
          if (categoryName && categoryName.trim() !== '') {
            if (categoryMap.has(categoryName)) {
              categoryMap.set(categoryName, categoryMap.get(categoryName) + 1);
            } else {
              categoryMap.set(categoryName, 1);
            }
          }
        });

        const categories = Array.from(categoryMap.entries())
          .map(([name, count], index) => ({
            id: `cat_${index + 1}`,
            name: name,
            servicesCount: count,
            selected: false
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        console.log(`🔍 Extracted ${categories.length} unique categories from services with service counts`);

        return NextResponse.json({
          success: true,
          data: {
            categories: categories,
            total: categories.length,
            provider: provider.name
          },
          error: null
        });
      } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
          { error: 'Failed to fetch categories: ' + (error instanceof Error ? error.message : 'Unknown error'), success: false, data: null },
          { status: 500 }
        );
      }
    }
    if (action === 'services' && providerId && categories) {
      try {
        console.log('🔥 Services request:', { providerId, categories });

        const provider = await db.apiProviders.findUnique({
          where: { id: parseInt(providerId) }
        });

        if (!provider) {
          console.log('❌ Provider not found:', providerId);
          return NextResponse.json(
            { error: 'Provider not found', success: false, data: null },
            { status: 404 }
          );
        }

        console.log('✅ Provider found:', provider.name);

        const providerConfig = createProviderConfig(provider);
        console.log('🔧 Using dynamic config for provider:', provider.name);

        let providerServices = null;
        const categoriesArray = categories.split(',').map(c => c.trim());
        console.log('📋 Requested categories:', categoriesArray);

        const baseUrl = providerConfig.baseUrl;
        
        try {
          console.log(`🌐 Fetching services using POST method with standard SMM panel format`);
          
          const formData = new FormData();
          formData.append('key', providerConfig.apiKey);
          formData.append('action', 'services');
          
          const response = await retryApiCall(async () => {
            return await fetchWithTimeout(baseUrl, {
              method: 'POST',
              body: formData
            });
          });

          if (response.ok) {
            const data = await response.json();
            providerServices = Array.isArray(data) ? data : (data.services || data.data || data);
            console.log(`✅ POST method successful, got ${Array.isArray(providerServices) ? providerServices.length : 'unknown'} services`);
          }
        } catch (error) {
          console.error(`❌ POST method failed for ${baseUrl}:`, error);
        }

        if (!providerServices) {
          try {
            const servicesUrl = `${baseUrl}?key=${encodeURIComponent(providerConfig.apiKey)}&action=services`;
            console.log(`🌐 Trying GET method with query parameters: ${servicesUrl}`);
            
            const response = await retryApiCall(async () => {
              return await fetchWithTimeout(servicesUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
            });

            if (response.ok) {
              const data = await response.json();
              providerServices = Array.isArray(data) ? data : (data.services || data.data || data);
              console.log(`✅ GET method successful, got ${Array.isArray(providerServices) ? providerServices.length : 'unknown'} services`);
            }
          } catch (error) {
            console.error(`❌ GET method failed for ${baseUrl}:`, error);
          }
        }

        if (!providerServices || !Array.isArray(providerServices)) {
          console.log('❌ No services fetched from provider:', {
            providerServices: providerServices ? 'exists but not array' : 'null/undefined',
            type: typeof providerServices,
            isArray: Array.isArray(providerServices)
          });
          return NextResponse.json(
            { error: 'Failed to fetch services from provider', success: false, data: null },
            { status: 500 }
          );
        }

        console.log(`✅ Fetched ${providerServices.length} services from ${provider.name}`);

        const filteredServices = providerServices.filter((service: any) => {
          const serviceCategory = service.category?.toLowerCase() || '';
          return categoriesArray.some(cat => 
            serviceCategory.includes(cat.toLowerCase()) || 
            cat.toLowerCase().includes(serviceCategory)
          );
        });

        console.log(`🔍 Filtered to ${filteredServices.length} services for categories: ${categoriesArray.join(', ')}`);

        const formattedServices = filteredServices.map((service: any) => ({
          id: service.service || service.id,
          name: service.name,
          description: service.desc || service.description || '',
          category: service.category,
          price: parseFloat(service.rate || service.price || '0'),
          currency: service.currency || 'USD',
          min: parseInt(service.min || '1'),
          max: parseInt(service.max || '10000'),
          type: service.type || 'Default',
          refill: service.refill || false,
          cancel: service.cancel || false
        }));

        console.log(`✅ Returning ${formattedServices.length} formatted services`);

        return NextResponse.json({
          success: true,
          data: {
            services: formattedServices,
            total: formattedServices.length,
            provider: provider.name
          },
          error: null
        });

      } catch (error) {
        console.error('❌ Error in services request:', error);
        return NextResponse.json(
          {
            error: `Failed to fetch services: ${error instanceof Error ? error.message : 'Unknown error'}`,
            success: false,
            data: null
          },
          { status: 500 }
        );
      }
    }

    if (action === 'categories' && providerId) {
      try {
        const provider = await db.apiProviders.findUnique({
          where: { id: parseInt(providerId) }
        });

        if (!provider) {
          return NextResponse.json(
            { error: 'Provider not found', success: false, data: null },
            { status: 404 }
          );
        }

        const providerConfig = createProviderConfig(provider);

        let providerServices = null;
        const baseUrl = providerConfig.baseUrl;

        try {
          const formData = new FormData();
          formData.append('key', providerConfig.apiKey);
          formData.append('action', 'services');
          
          const response = await retryApiCall(async () => {
            return await fetchWithTimeout(baseUrl, {
              method: 'POST',
              body: formData
            });
          });

          if (response.ok) {
            const data = await response.json();
            providerServices = Array.isArray(data) ? data : (data.services || data.data || data);
          }
        } catch (error) {
          console.error('Error fetching services for categories (POST):', error);
        }

        if (!providerServices) {
          try {
            const servicesUrl = `${baseUrl}?key=${encodeURIComponent(providerConfig.apiKey)}&action=services`;
            const response = await retryApiCall(async () => {
              return await fetchWithTimeout(servicesUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
            });

            if (response.ok) {
              const data = await response.json();
              providerServices = Array.isArray(data) ? data : (data.services || data.data || data);
            }
          } catch (error) {
            console.error('Error fetching services for categories (GET):', error);
          }
        }

        if (!providerServices || !Array.isArray(providerServices)) {
          return NextResponse.json(
            { error: 'Failed to fetch services from provider', success: false, data: null },
            { status: 500 }
          );
        }

        const categoryMap = new Map<string, number>();
        
        providerServices.forEach((service: any) => {
          const category = service.category;
          if (category && category.trim() !== '') {
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
          }
        });

        const categories = Array.from(categoryMap.entries())
          .map(([name, servicesCount], index) => ({
            id: index + 1,
            name: name,
            servicesCount: servicesCount,
            selected: false
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
          success: true,
          data: {
            categories: categories,
            total: categories.length,
            provider: provider.name
          },
          error: null
        });
      } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
          { error: 'Failed to fetch categories: ' + (error instanceof Error ? error.message : 'Unknown error'), success: false, data: null },
          { status: 500 }
        );
      }
    }

    try {
      const configuredProviders = await db.apiProviders.findMany({
        where: {
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          api_key: true,
          status: true
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      return NextResponse.json({
        success: true,
        data: {
          providers: configuredProviders,
          total: configuredProviders.length
        },
        error: null
      });
    } catch (error) {
      console.error('Error fetching default providers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch providers: ' + (error instanceof Error ? error.message : 'Unknown error'), success: false, data: null },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data: ' + (error instanceof Error ? error.message : 'Unknown error'), success: false, data: null },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { providerId, services, profitMargin } = body;

    if (services && Array.isArray(services) && providerId) {
      console.log('🔥 Import request:', { providerId, servicesCount: services.length });

      const provider = await db.apiProviders.findUnique({
        where: { id: parseInt(providerId) }
      });

      if (!provider) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      console.log('✅ Provider found:', provider.name);

      const currencies = await db.currencies.findMany({
        where: { enabled: true },
        select: {
          id: true,
          code: true,
          symbol: true,
          rate: true,
          name: true,
          enabled: true
        }
      });
      const formattedCurrencies = currencies.map(c => ({
        id: c.id,
        code: c.code,
        symbol: c.symbol,
        rate: Number(c.rate),
        name: c.name,
        enabled: c.enabled
      }));

      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const service of services) {
        try {
          console.log(`📝 Processing service: ${service.name} (ID: ${service.id})`);

          const existingService = await db.services.findFirst({
            where: {
              OR: [
                { name: service.name },
                { updateText: { contains: `"providerServiceId":"${service.id}"` } }
              ]
            }
          });

          if (existingService) {
            console.log(`⚠️ Service already exists: ${service.name}`);
            skippedCount++;
            continue;
          }

          let baseProviderPrice = service.providerPrice || service.rate || service.price || 0;
          const originalProviderPrice = service.providerPrice || service.rate || service.price || 0;
          
          if (service.providerPrice && service.rate) {
            baseProviderPrice = service.providerPrice;
          }
          
          if (service.currency && service.currency !== 'USD') {
            try {
              baseProviderPrice = convertToUSD(baseProviderPrice, service.currency, formattedCurrencies);
              console.log(`💱 Converted ${originalProviderPrice} ${service.currency} to ${baseProviderPrice} USD`);
            } catch (conversionError) {
              console.warn(`⚠️ Currency conversion failed for ${service.name}:`, conversionError);
            }
          }

          const servicePercentage = service.percent || profitMargin || 0;
          const finalRate = parseFloat((baseProviderPrice * (1 + servicePercentage / 100)).toFixed(2));
          console.log(`💰 Calculating rate: Base Provider $${baseProviderPrice} + ${servicePercentage}% = $${finalRate}`);

          // Map service type to serviceTypeId using predefined mapping
          // Since service types are predefined, we determine serviceTypeId from packageType
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

          // Try to determine packageType from service type name or use default
          const mapServiceTypeToPackageType = (typeName: string): number => {
            if (!typeName) return 1;
            
            const normalizedType = typeName.toLowerCase().trim();
            
            const typeMapping: Record<string, number> = {
              'default': 1,
              'standard': 1,
              'basic': 1,
              'normal': 1,
              'package': 2,
              'special comments': 3,
              'custom comments': 3,
              'comments': 3,
              'package comments': 4,
              'auto likes': 11,
              'auto views': 12,
              'auto comments': 13,
              'subscription': 14,
              'subscriptions': 14,
              'limited auto likes': 15,
            };
            
            return typeMapping[normalizedType] || 1;
          };

          const packageType = service.type ? mapServiceTypeToPackageType(service.type) : 1;
          let serviceTypeId = packageTypeToServiceTypeId[packageType] || 1;
          
          console.log(`Mapped service type "${service.type || 'undefined'}" to packageType ${packageType} -> serviceTypeId ${serviceTypeId}`);

          const categoryName = service.category && service.category.trim() !== '' 
            ? service.category.trim() 
            : 'Uncategorized';
            
          let category = await db.categories.findFirst({
            where: { category_name: categoryName }
          });

          if (!category) {
            category = await db.categories.create({
              data: {
                category_name: categoryName,
                status: 'active',
                userId: session.user.id
              }
            });
            console.log(`Created new category: ${categoryName}`);
          }

          const newService = await db.services.create({
            data: {
              name: service.name,
              description: service.desc || service.description || `${service.name} - Imported from ${provider.name}`,
              rate: finalRate,
              min_order: service.min || 100,
              max_order: service.max || 10000,
              avg_time: 'Not enough data',
              status: 'active',
              perqty: 1000,
              mode: 'auto',
              refill: service.refill || false,
              cancel: service.cancel || false,
              userId: session.user.id,
              categoryId: category.id,
              serviceTypeId: serviceTypeId,
              providerId: provider.id,
              providerName: provider.name,
              providerServiceId: service.id?.toString(),
              providerPrice: originalProviderPrice,
              percentage: service.percent || profitMargin || 0,
              updateText: JSON.stringify({
                provider: provider.name,
                providerId: provider.id,
                providerServiceId: service.id?.toString(),
                originalRate: originalProviderPrice,
                importedAt: new Date().toISOString(),
                type: service.type,
                mode: 'auto',
              }),
              packageType: packageType,
            },
          });

          importedCount++;
        } catch (serviceError) {
          skippedCount++;
          const errorMsg = `Failed to import ${service.name}: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`;
          console.error('?', errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`?? Import completed: ${importedCount} imported, ${skippedCount} skipped, ${errors.length} errors`);

      return NextResponse.json({
        success: true,
        data: {
          imported: importedCount,
          skipped: skippedCount,
          errors: errors.length,
          errorDetails: errors,
          provider: provider.name
        }
      });
    }
    
    const { action } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const provider = await db.apiProviders.findUnique({
      where: { id: parseInt(providerId) }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    if (action === 'test_connection') {
      const providerConfig = createProviderConfig(provider);
      const baseUrl = providerConfig.baseUrl;
      
      try {
        const isReachable = await checkUrlReachability(baseUrl);
        
        if (!isReachable) {
          return NextResponse.json({
            success: false,
            error: 'Provider API is not reachable',
            data: { reachable: false }
          });
        }

        const endpoints = providerConfig.endpoints;
        let testSuccessful = false;
        
        if (endpoints.services) {
          try {
            const testUrl = `${baseUrl}${endpoints.services}`;
            const response = await fetchWithTimeout(testUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${providerConfig.apiKey}`,
                'Content-Type': 'application/json',
                ...providerConfig.headers
              }
            }, 10000);
            
            testSuccessful = response.ok;
          } catch (error) {
            console.error('Test connection failed:', error);
          }
        }

        return NextResponse.json({
          success: testSuccessful,
          data: {
            reachable: isReachable,
            authenticated: testSuccessful,
            provider: provider.name
          },
          error: testSuccessful ? null : 'Authentication failed or API error'
        });

      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
          data: { reachable: false, authenticated: false }
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Request failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
