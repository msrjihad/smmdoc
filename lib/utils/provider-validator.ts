import { db } from '@/lib/db';
import { ApiRequestBuilder } from '@/lib/provider-api-specification';

export interface ProviderValidationResult {
  isValid: boolean;
  error?: string;
  provider?: {
    id: number;
    name: string;
    api_key: string;
    api_url: string;
    status: string;
  };
}

export async function validateProvider(providerId: number): Promise<ProviderValidationResult> {
  try {

    const provider = await db.apiProviders.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        name: true,
        api_key: true,
        api_url: true,
        status: true
      }
    });

    if (!provider) {
      return {
        isValid: false,
        error: 'Provider not found'
      };
    }

    if (provider.status !== 'active') {
      return {
        isValid: false,
        error: 'Provider is not active'
      };
    }

    if (!provider.api_key || provider.api_key.trim() === '') {
      return {
        isValid: false,
        error: 'Provider API key is missing or empty'
      };
    }

    if (!provider.api_url || provider.api_url.trim() === '') {
      return {
        isValid: false,
        error: 'API URL is missing or empty'
      };
    }

    try {
      new URL(provider.api_url);
    } catch {
      return {
        isValid: false,
        error: 'Invalid API URL format'
      };
    }

    return {
      isValid: true,
      provider
    };

  } catch (error) {
    console.error('Error validating provider:', error);
    return {
      isValid: false,
      error: 'Database error while validating provider'
    };
  }
}

export async function validateProviderByName(providerName: string): Promise<ProviderValidationResult> {
  try {

    const provider = await db.apiProviders.findUnique({
      where: { name: providerName },
      select: {
        id: true,
        name: true,
        api_key: true,
        api_url: true,
        status: true
      }
    });

    if (!provider) {
      return {
        isValid: false,
        error: 'Provider not found'
      };
    }

    return validateProvider(provider.id);

  } catch (error) {
    console.error('Error validating provider by name:', error);
    return {
      isValid: false,
      error: 'Database error while validating provider'
    };
  }
}

export async function getValidProviders(): Promise<Array<{
  id: number;
  name: string;
  api_key: string;
  api_url: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}>> {
  try {
    const providers = await db.apiProviders.findMany({
      where: {
        status: 'active',
        api_key: {
          not: ''
        },
        api_url: {
          not: ''
        }
      },
      select: {
        id: true,
        name: true,
        api_key: true,
        api_url: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const validProviders = providers.filter(provider => {
      try {
        new URL(provider.api_url);
        return true;
      } catch {
        console.warn(`Provider ${provider.name} has invalid API URL: ${provider.api_url}`);
        return false;
      }
    });

    return validProviders;

  } catch (error) {
    console.error('Error getting valid providers:', error);
    return [];
  }
}

export async function testProviderConnection(providerId: number): Promise<{success: boolean, error?: string}> {
  try {
    const validation = await validateProvider(providerId);

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const provider = validation.provider!;

    const isTestProvider = provider.api_url.includes('samplesmm.com') || 
                          provider.api_url.includes('api.com') ||
                          provider.api_key.startsWith('sample_') ||
                          provider.api_key.startsWith('sp_api_') ||
                          provider.name.toLowerCase().includes('sample') ||
                          provider.name.toLowerCase().includes('test');

    if (isTestProvider) {
      console.log(`Skipping real API test for test provider: ${provider.name}`);
      return { 
        success: true,
        error: undefined
      };
    }

    try {

      const { DEFAULT_SMM_API_SPEC } = await import('@/lib/provider-api-specification');
      const requestBuilder = new ApiRequestBuilder(DEFAULT_SMM_API_SPEC, provider.api_url, provider.api_key);
      const servicesRequest = requestBuilder.buildServicesRequest();

      const response = await fetch(servicesRequest.url, {
        method: servicesRequest.method,
        headers: servicesRequest.headers,
        body: servicesRequest.data,
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) || (data && typeof data === 'object')) {
          return { success: true };
        }
      }

      return {
        success: false,
        error: `API responded with status ${response.status}`
      };

    } catch (error) {
      return {
        success: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

  } catch (error) {
    return {
      success: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
