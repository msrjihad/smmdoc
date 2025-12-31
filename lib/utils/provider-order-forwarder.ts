import { Provider } from '@/types/provider';
import { ApiRequestBuilder, ApiResponseParser, createApiSpecFromProvider } from '@/lib/provider-api-specification';

export interface ProviderOrderRequest {
  service: string;
  link: string;
  quantity?: number;
  comments?: string;
  runs?: number;
  interval?: number;
  packageType?: number;
}

export interface ProviderOrderResponse {
  order: string;
  charge: number;
  start_count?: number;
  status: string;
  remains?: number;
  currency: string;
}

export interface ProviderStatusResponse {
  charge: number;
  start_count: bigint;
  status: string;
  remains: bigint;
  currency: string;
}

export class ProviderOrderForwarder {
  private static instance: ProviderOrderForwarder;

  public static getInstance(): ProviderOrderForwarder {
    if (!ProviderOrderForwarder.instance) {
      ProviderOrderForwarder.instance = new ProviderOrderForwarder();
    }
    return ProviderOrderForwarder.instance;
  }

  async forwardOrderToProvider(
    provider: Provider,
    orderData: ProviderOrderRequest
  ): Promise<ProviderOrderResponse> {
    try {
      const apiType = (provider as any).api_type || (provider as any).apiType || 1;
      
      if (apiType === 3) {
        return await this.forwardOrderToSocialsMediaAPI(provider, orderData);
      }
      
      return await this.forwardOrderToStandardAPI(provider, orderData);
    } catch (error) {
      console.error('Error forwarding order to provider:', error);
      throw error;
    }
  }

  private async forwardOrderToStandardAPI(
    provider: Provider,
    orderData: ProviderOrderRequest
  ): Promise<ProviderOrderResponse> {
    const apiSpec = createApiSpecFromProvider(provider);
    const requestBuilder = new ApiRequestBuilder(
      apiSpec,
      provider.api_url,
      provider.api_key,
      (provider as any).http_method || (provider as any).httpMethod || 'POST'
    );

    const packageType = orderData.packageType || 1;
    let quantity = orderData.quantity;
    let comments = orderData.comments;

    if (packageType === 3 || packageType === 4) {
      quantity = undefined;
    } else if (packageType === 2) {
      quantity = undefined;
    }

    const orderRequest = requestBuilder.buildAddOrderRequest(
      orderData.service,
      orderData.link,
      quantity,
      comments,
      orderData.runs,
      orderData.interval
    );

    const response = await fetch(orderRequest.url, {
      method: orderRequest.method,
      headers: orderRequest.headers,
      body: orderRequest.data,
    });

    if (!response.ok) {
      throw new Error(`Provider API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`Provider error: ${result.error}`);
    }

    if (!result.order) {
      throw new Error(`Provider did not return order ID: ${JSON.stringify(result)}`);
    }

    const responseParser = new ApiResponseParser(apiSpec);
    const parsedOrder = responseParser.parseAddOrderResponse(result);

    return {
      order: parsedOrder.orderId,
      charge: (result as any).charge || 0,
      start_count: (result as any).start_count || (result as any).startCount || 0,
      status: this.mapProviderStatus((result as any).status || 'Pending'),
      remains: (result as any).remains || 0,
      currency: (result as any).currency || 'USD'
    };
  }

  private async forwardOrderToSocialsMediaAPI(
    provider: Provider,
    orderData: ProviderOrderRequest
  ): Promise<ProviderOrderResponse> {
    const axios = (await import('axios')).default;
    
    const packageType = orderData.packageType || 1;
    
    if (packageType === 11 || packageType === 12 || packageType === 13) {
      return {
        order: '',
        charge: 0,
        start_count: 0,
        status: 'pending',
        remains: 0,
        currency: 'USD'
      };
    }

    const orderPayload = {
      cmd: 'orderadd',
      token: provider.api_key,
      apiurl: provider.api_url,
      orders: [[{
        service: orderData.service,
        amount: orderData.quantity || 0,
        data: orderData.link
      }]]
    };

    try {
      const response = await axios({
        method: 'POST',
        url: provider.api_url,
        data: new URLSearchParams({
          jsonapi: JSON.stringify(orderPayload, null, 0)
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: ((provider as any).timeout_seconds || 30) * 1000
      });

      const result = response.data;

      if (result[0]?.[0]?.status === 'error') {
        throw new Error(`Provider error: ${JSON.stringify(result)}`);
      }

      const orderId = result[0]?.[0]?.id;
      if (!orderId) {
        throw new Error(`Provider did not return order ID: ${JSON.stringify(result)}`);
      }

      const statusResult = await this.checkSocialsMediaOrderStatus(provider, orderId);
      const balanceResult = await this.getSocialsMediaBalance(provider);

      return {
        order: orderId.toString(),
        charge: statusResult.charge || 0,
        start_count: Number(statusResult.start_count || 0),
        status: this.mapProviderStatus(statusResult.status || 'Pending'),
        remains: Number(statusResult.remains || 0),
        currency: balanceResult.currency || 'USD'
      };
    } catch (error: any) {
      console.error('SocialsMedia API error:', error);
      if (error.response) {
        throw new Error(`Provider API error: ${error.response.status} ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  private async checkSocialsMediaOrderStatus(
    provider: Provider,
    orderId: string
  ): Promise<ProviderStatusResponse> {
    const axios = (await import('axios')).default;
    
    const statusPayload = {
      cmd: 'orderstatus',
      token: provider.api_key,
      apiurl: provider.api_url,
      orderid: [orderId]
    };

    const response = await axios({
      method: 'POST',
      url: provider.api_url,
      data: new URLSearchParams({
        jsonapi: JSON.stringify(statusPayload, null, 0)
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: ((provider as any).timeout_seconds || 30) * 1000
    });

    const result = response.data;
    const orderData = result[orderId]?.order;

    return {
      charge: orderData?.price || 0,
      start_count: orderData?.start_count ? BigInt(orderData.start_count) : BigInt(0),
      status: orderData?.status || 'Pending',
      remains: orderData?.remains ? BigInt(orderData.remains) : BigInt(0),
      currency: orderData?.currency || 'USD'
    };
  }

  private async getSocialsMediaBalance(provider: Provider): Promise<{ balance: number; currency: string }> {
    const axios = (await import('axios')).default;
    
    const balancePayload = {
      cmd: 'profile',
      token: provider.api_key,
      apiurl: provider.api_url
    };

    const response = await axios({
      method: 'POST',
      url: provider.api_url,
      data: new URLSearchParams({
        jsonapi: JSON.stringify(balancePayload, null, 0)
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: ((provider as any).timeout_seconds || 30) * 1000
    });

    const result = response.data;

    return {
      balance: result.balance || 0,
      currency: result.currency || 'USD'
    };
  }

  async forwardRefillOrderToProvider(
    provider: Provider,
    originalProviderOrderId: string
  ): Promise<{ refill: string; status: string; error?: string }> {
    try {
      const apiType = (provider as any).api_type || (provider as any).apiType || 1;
      
      if (apiType === 3) {
        // SocialsMedia API doesn't support refill in the same way
        throw new Error('Refill not supported for SocialsMedia API type');
      }
      
      const apiSpec = createApiSpecFromProvider(provider);
      const requestBuilder = new ApiRequestBuilder(
        apiSpec,
        provider.api_url,
        provider.api_key,
        (provider as any).http_method || (provider as any).httpMethod || 'POST'
      );

      const refillRequest = requestBuilder.buildRefillRequest(originalProviderOrderId);

      const response = await fetch(refillRequest.url, {
        method: refillRequest.method,
        headers: refillRequest.headers,
        body: refillRequest.data,
        signal: AbortSignal.timeout((apiSpec.timeoutSeconds || 30) * 1000)
      });

      if (!response.ok) {
        throw new Error(`Provider API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        return {
          refill: '',
          status: 'error',
          error: result.error
        };
      }

      // Parse refill ID from response (matches old project: result->refill)
      // Check response mapping first, then common field names
      let refillId = '';
      const responseParser = new ApiResponseParser(apiSpec);
      const refillMapping = apiSpec.responseMapping?.refill;
      
      if (refillMapping?.refillId) {
        // Use response mapping if available
        const path = refillMapping.refillId.split('.');
        refillId = path.reduce((obj: any, key: string) => obj?.[key], result) || '';
      } else {
        // Fallback to common field names (matches old project: $res->refill)
        refillId = result.refill || result.refill_id || result.refillId || result.refillOrderId || '';
      }
      
      return {
        refill: refillId,
        status: result.status || 'pending',
        error: result.error
      };
    } catch (error) {
      console.error('Error forwarding refill to provider:', error);
      throw error;
    }
  }

  async checkProviderOrderStatus(
    provider: Provider,
    providerOrderId: string
  ): Promise<ProviderStatusResponse> {
    try {
      const apiType = (provider as any).api_type || (provider as any).apiType || 1;
      
      if (apiType === 3) {
        return await this.checkSocialsMediaOrderStatus(provider, providerOrderId);
      }
      
      const apiSpec = createApiSpecFromProvider(provider);
      const requestBuilder = new ApiRequestBuilder(
        apiSpec,
        provider.api_url,
        provider.api_key,
        (provider as any).http_method || (provider as any).httpMethod || 'POST'
      );

      const statusRequest = requestBuilder.buildOrderStatusRequest(providerOrderId);

      const response = await fetch(statusRequest.url, {
        method: statusRequest.method,
        headers: statusRequest.headers,
        body: statusRequest.data,
      });

      if (!response.ok) {
        throw new Error(`Provider API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`Provider error: ${result.error}`);
      }

      const responseParser = new ApiResponseParser(apiSpec);
      const parsedStatus = responseParser.parseOrderStatusResponse(result);

      return {
        charge: parsedStatus.charge,
        start_count: parsedStatus.startCount,
        status: this.mapProviderStatus(parsedStatus.status),
        remains: parsedStatus.remains,
        currency: parsedStatus.currency || 'USD'
      };
    } catch (error) {
      console.error('Error checking provider order status:', error);
      throw error;
    }
  }

  async getProviderServices(provider: Provider): Promise<Array<{
    service: string;
    name: string;
    category: string;
    rate: number;
    min: number;
    max: number;
    type: string;
    refill?: boolean;
    cancel?: boolean;
  }>> {
    try {
      const apiSpec = createApiSpecFromProvider(provider);
      const requestBuilder = new ApiRequestBuilder(
        apiSpec,
        provider.api_url,
        provider.api_key,
        (provider as any).http_method || (provider as any).httpMethod || 'POST'
      );

      const servicesRequest = requestBuilder.buildServicesRequest();

      const response = await fetch(servicesRequest.url, {
        method: servicesRequest.method,
        headers: servicesRequest.headers,
        body: servicesRequest.data,
      });

      if (!response.ok) {
        throw new Error(`Provider API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`Provider error: ${result.error}`);
      }

      const responseParser = new ApiResponseParser(apiSpec);
      const parsedServices = responseParser.parseServicesResponse(result);

      return parsedServices.map(service => ({
        service: service.serviceId,
        name: service.name,
        category: service.category,
        rate: service.rate,
        min: service.min,
        max: service.max,
        type: service.type,
        refill: service.refill,
        cancel: service.cancel
      }));
    } catch (error) {
      console.error('Error fetching provider services:', error);
      throw error;
    }
  }

  async getProviderBalance(provider: Provider): Promise<number> {
    try {
      const apiSpec = createApiSpecFromProvider(provider);
      const requestBuilder = new ApiRequestBuilder(
        apiSpec,
        provider.api_url,
        provider.api_key,
        (provider as any).http_method || (provider as any).httpMethod || 'POST'
      );

      const balanceRequest = requestBuilder.buildBalanceRequest();

      console.log('Balance request config:', {
        url: balanceRequest.url,
        method: balanceRequest.method,
        hasData: !!balanceRequest.data,
        headers: balanceRequest.headers
      });

      const axios = (await import('axios')).default;
      
      const response = await axios({
        method: balanceRequest.method as any,
        url: balanceRequest.url,
        data: balanceRequest.data,
        headers: balanceRequest.headers,
        timeout: ((provider as any).timeout_seconds || 30) * 1000,
      });

      const result = response.data;

      if (result.error) {
        throw new Error(`Provider error: ${result.error}`);
      }

      const responseParser = new ApiResponseParser(apiSpec);
      const parsedBalance = responseParser.parseBalanceResponse(result);

      return parsedBalance.balance;
    } catch (error: any) {
      console.error('Error fetching provider balance:', error);
      if (error.response) {
        throw new Error(`Provider API error: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error(`Provider API request failed: ${error.message}`);
      } else {
        throw new Error(`Provider balance error: ${error.message}`);
      }
    }
  }

  private mapProviderStatus(providerStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'pending',
      'In progress': 'processing',
      'Processing': 'processing',
      'Completed': 'completed',
      'Partial': 'partial',
      'Canceled': 'cancelled',
      'Cancelled': 'cancelled',
      'Failed': 'failed',
      'Error': 'failed'
    };

    return statusMap[providerStatus] || 'pending';
  }

  validateProvider(provider: Provider): boolean {
    if (!provider.api_url || !provider.api_key) {
      return false;
    }

    try {
      new URL(provider.api_url);
    } catch {
      return false;
    }

    return true;
  }

  async testProviderConnection(provider: Provider): Promise<boolean> {
    try {
      await this.getProviderBalance(provider);
      return true;
    } catch (error) {
      console.error('Provider connection test failed:', error);
      return false;
    }
  }

  async syncOrdersStatus(
    provider: Provider,
    providerOrderIds: string[]
  ): Promise<{ [orderId: string]: ProviderStatusResponse }> {
    const results: { [orderId: string]: ProviderStatusResponse } = {};

    for (const orderId of providerOrderIds) {
      try {
        const status = await this.checkProviderOrderStatus(provider, orderId);
        results[orderId] = status;
      } catch (error) {
        console.error(`Failed to sync status for order ${orderId}:`, error);
      }
    }

    return results;
  }

  calculateProviderCost(
    serviceRate: number,
    quantity: number,
    markup: number = 0
  ): number {
    const baseCost = (serviceRate / 1000) * quantity;
    const markupAmount = baseCost * (markup / 100);
    return baseCost + markupAmount;
  }

  formatProviderError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error.message) {
      return error.message;
    }

    return 'Unknown provider error occurred';
  }
}

export default ProviderOrderForwarder;