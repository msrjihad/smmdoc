import { db } from '@/lib/db';

interface PaymentGatewayConfig {
  gatewayName: string;
  apiKey: string;
  apiUrl: string;
  mode: 'Live' | 'Sandbox';
}

const defaultConfig: PaymentGatewayConfig = {
  gatewayName: 'UddoktaPay',
  apiKey: '',
  apiUrl: '',
  mode: 'Live',
};

let cachedConfig: PaymentGatewayConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getPaymentGatewayConfig(): Promise<PaymentGatewayConfig> {
  const now = Date.now();
  
  if (cachedConfig && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const settings = await db.paymentGatewaySettings.findFirst();
    
    if (settings) {
      const mode = (settings.mode as 'Live' | 'Sandbox') || defaultConfig.mode;
      
      cachedConfig = {
        gatewayName: settings.gatewayName || defaultConfig.gatewayName,
        apiKey: mode === 'Live' 
          ? (settings.liveApiKey || '') 
          : (settings.sandboxApiKey || ''),
        apiUrl: mode === 'Live' 
          ? (settings.liveApiUrl || '') 
          : (settings.sandboxApiUrl || ''),
        mode: mode,
      };
    } else {
      cachedConfig = defaultConfig;
    }
    
    cacheTimestamp = now;
    return cachedConfig;
  } catch (error) {
    console.error('Error fetching payment gateway settings:', error);
    return cachedConfig || defaultConfig;
  }
}

export async function getPaymentGatewayApiKey(): Promise<string> {
  const config = await getPaymentGatewayConfig();
  return config.apiKey;
}

export async function getPaymentGatewayBaseUrl(): Promise<string> {
  const config = await getPaymentGatewayConfig();
  return config.apiUrl;
}

export async function getPaymentGatewayCheckoutUrl(): Promise<string> {
  const config = await getPaymentGatewayConfig();
  const baseUrl = config.apiUrl.trim();
  
  if (!baseUrl) {
    return 'https://pay.smmdoc.com/api/checkout-v2';
  }
  
  const cleanUrl = baseUrl.replace(/\/$/, '');
  
  if (cleanUrl.includes('/checkout-v2')) {
    return cleanUrl;
  }
  
  return `${cleanUrl}/checkout-v2`;
}

export async function getPaymentGatewayVerifyUrl(): Promise<string> {
  const config = await getPaymentGatewayConfig();
  const baseUrl = config.apiUrl.trim();
  
  if (!baseUrl) {
    return 'https://pay.smmdoc.com/api/verify-payment';
  }
  
  const cleanUrl = baseUrl.replace(/\/$/, '');
  
  if (cleanUrl.includes('/api/verify-payment')) {
    return cleanUrl;
  }
  
  if (cleanUrl.includes('/verify-payment')) {
    return cleanUrl;
  }
  
  if (cleanUrl.includes('/api')) {
    return `${cleanUrl}/verify-payment`;
  }
  
  return `${cleanUrl}/api/verify-payment`;
}

export async function getPaymentGatewayName(): Promise<string> {
  const config = await getPaymentGatewayConfig();
  return config.gatewayName;
}

export async function getPaymentGatewayExchangeRate(): Promise<number> {
  try {
    const settings = await db.paymentGatewaySettings.findFirst();
    return settings?.exchangeRate ?? 120.00;
  } catch (error) {
    console.error('Error fetching payment gateway exchange rate:', error);
    return 120.00;
  }
}

export function clearPaymentGatewayCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

