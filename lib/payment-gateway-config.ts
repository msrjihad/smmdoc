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
  
  // Check if URL already contains verify endpoint
  if (cleanUrl.includes('/checkout/verify-payment-data') || cleanUrl.includes('/verify-payment-data')) {
    return cleanUrl;
  }
  
  if (cleanUrl.includes('/api/verify-payment')) {
    return cleanUrl;
  }
  
  if (cleanUrl.includes('/verify-payment')) {
    return cleanUrl;
  }
  
  // Handle sandbox URL structure
  // Base URL might be: https://sandbox.uddoktapay.com/api/checkout-v2
  // Server-side verify URL should be: https://sandbox.uddoktapay.com/api/verify-payment
  // (NOT /checkout/verify-payment-data which is browser-only and requires cookies)
  if (cleanUrl.includes('sandbox.uddoktapay.com')) {
    try {
      // Extract base domain (remove /api/checkout-v2 or any path)
      const urlObj = new URL(cleanUrl);
      const baseDomain = `${urlObj.protocol}//${urlObj.host}`;
      const verifyUrl = `${baseDomain}/api/verify-payment`;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Payment Gateway Config] Sandbox verify URL constructed: ${verifyUrl} from base: ${cleanUrl}`);
      }
      return verifyUrl;
    } catch (urlError) {
      console.error('[Payment Gateway Config] Error parsing sandbox URL:', urlError, 'cleanUrl:', cleanUrl);
      // Fallback: try to extract domain manually
      const match = cleanUrl.match(/^(https?:\/\/[^\/]+)/);
      if (match) {
        const verifyUrl = `${match[1]}/api/verify-payment`;
        console.log(`[Payment Gateway Config] Using fallback sandbox verify URL: ${verifyUrl}`);
        return verifyUrl;
      }
    }
  }
  
  // Handle live/production URL structure
  // Base URL might be: https://pay.uddoktapay.com/api/checkout-v2
  // But verify URL should be: https://pay.uddoktapay.com/api/verify-payment
  if (cleanUrl.includes('uddoktapay.com') && !cleanUrl.includes('sandbox')) {
    try {
      // Extract base domain
      const urlObj = new URL(cleanUrl);
      const baseDomain = `${urlObj.protocol}//${urlObj.host}`;
      return `${baseDomain}/api/verify-payment`;
    } catch (urlError) {
      console.error('[Payment Gateway Config] Error parsing live URL:', urlError, 'cleanUrl:', cleanUrl);
      // Fallback
      const match = cleanUrl.match(/^(https?:\/\/[^\/]+)/);
      if (match) {
        return `${match[1]}/api/verify-payment`;
      }
    }
  }
  
  // Handle live/production URL structure
  if (cleanUrl.includes('/api')) {
    // If base URL has /api/checkout-v2, replace with /api/verify-payment
    if (cleanUrl.includes('/checkout-v2')) {
      return cleanUrl.replace('/checkout-v2', '/verify-payment');
    }
    return `${cleanUrl}/verify-payment`;
  }
  
  // Default: try /api/verify-payment
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

