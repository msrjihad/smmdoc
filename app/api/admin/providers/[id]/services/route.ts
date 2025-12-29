import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const providerId = parseInt(resolvedParams.id);

    if (isNaN(providerId)) {
      return NextResponse.json(
        {
          error: 'Invalid provider ID',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const provider = await db.apiProviders.findUnique({
      where: { id: providerId }
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



    if (!provider.api_url || !provider.api_key) {

      return NextResponse.json(
        {
          error: 'Provider API configuration is incomplete',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    try {
      const apiKeyParam = provider.api_key_param || 'key';
      const actionParam = provider.action_param || 'action';
      const servicesAction = provider.services_action || 'services';
      const httpMethod = provider.http_method || 'POST';
      
      let requestOptions: RequestInit = {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: AbortSignal.timeout(30000)
      };

      let servicesUrl = provider.api_url;

      if (httpMethod.toUpperCase() === 'GET') {
        servicesUrl = `${provider.api_url}?${apiKeyParam}=${encodeURIComponent(provider.api_key)}&${actionParam}=${servicesAction}`;
      } else {
        const formData = new URLSearchParams();
        formData.append(apiKeyParam, provider.api_key);
        formData.append(actionParam, servicesAction);
        requestOptions.body = formData.toString();
      }



      const response = await fetch(servicesUrl, requestOptions);

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const apiServices = await response.json();



      let servicesArray = [];

      if (Array.isArray(apiServices)) {
        servicesArray = apiServices;
      } else if (typeof apiServices === 'object' && apiServices !== null) {
        if (Array.isArray(apiServices.services)) {
          servicesArray = apiServices.services;
        } else if (Array.isArray(apiServices.data)) {
          servicesArray = apiServices.data;
        } else if (Array.isArray(apiServices.result)) {
          servicesArray = apiServices.result;
        } else if (apiServices.success && Array.isArray(apiServices.data)) {
          servicesArray = apiServices.data;
        } else {
           throw new Error(`Invalid API response format - expected array of services or object with services array. Got object with keys: ${Object.keys(apiServices).join(', ')}`);
         }
      } else {
        throw new Error(`Invalid API response format - expected array or object, got: ${typeof apiServices}`);
      }

      if (!Array.isArray(servicesArray) || servicesArray.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            services: [],
            total: 0,
            provider: {
              id: provider.id,
              name: provider.name
            }
          },
          error: null
        });
      }

      const transformedServices = servicesArray.map((service: any) => ({
        id: service.service || service.id,
        name: service.name,
        description: service.desc || service.description || '',
        rate: parseFloat(service.rate) || 0,
        min: parseInt(service.min) || 1,
        max: parseInt(service.max) || 1000000,
        category: service.category || 'Uncategorized',
        type: service.type || 'Default',
        refill: service.refill === true || service.refill === 1 || service.refill === '1' || 
                service.refill_enabled === true || service.refill_enabled === 1 || service.refill_enabled === '1' ||
                service.refillEnabled === true || service.refillEnabled === 1 || service.refillEnabled === '1' ||
                false,
        cancel: service.cancel === true || service.cancel === 1 || service.cancel === '1' || 
                service.cancel_enabled === true || service.cancel_enabled === 1 || service.cancel_enabled === '1' ||
                service.cancelEnabled === true || service.cancelEnabled === 1 || service.cancelEnabled === '1' ||
                false
      }));

      return NextResponse.json({
        success: true,
        data: {
          services: transformedServices,
          total: transformedServices.length,
          provider: {
            id: provider.id,
            name: provider.name
          }
        },
        error: null
      });

    } catch (apiError) {
      console.error('Error fetching services from provider API:', apiError);
      return NextResponse.json(
        {
          error: `Failed to fetch services from provider: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
          success: false,
          data: null
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in provider services endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch provider services: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
