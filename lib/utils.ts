
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const revalidate = { next: { revalidate: 3600 } };

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'ZodError' && 'errors' in error) {

      const fieldErrors = (error as any).errors.map((err: any) => err.message);
      return fieldErrors.join('. ');
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;

      if (prismaError.code === 'P2002') {
        const field = extractFieldName(prismaError.meta?.target);
        return `${capitalize(field)} already exists.`;
      }

      if (prismaError.code === 'P2025') {
        const cause = prismaError.meta?.cause || 'Record';
        return `${capitalize(cause)} not found.`;
      }
    }

    if (error.name === 'PrismaClientInitializationError') {
      return 'Database connection failed. Please check your database configuration.';
    }






    return error.message;
  }

  return typeof error === 'string' ? error : JSON.stringify(error);
}

export function handleError(error: unknown): string {
  const formattedErrorMessage = formatError(error);
  if (process.env.NODE_ENV === 'production') {

    console.error('Error in production mode:', error);
  } else {
    console.error('Error in development mode:', error);
  }
  return formattedErrorMessage;
}

function extractFieldName(target: any): string {
  if (!target) return 'Field';
  if (Array.isArray(target)) target = target[0];

  return (
    target
      .replace(/^(.*?)(_key)?$/, '$1')
      .split('_')
      .pop() || 'Field'
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatNumber(num: number | string): string {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '0';
  return new Intl.NumberFormat('en-US').format(number);
}

export function formatCurrency(amount: number, currency: 'USD' | 'BDT' = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : '৳';
  return `${symbol}${formatNumber(amount.toFixed(2))}`;
}

export function formatPrice(amount: number, decimals: number = 2): string {
  return formatNumber(parseFloat(amount.toFixed(decimals)));
}

export function formatID(id: number | string): string {
  const number = typeof id === 'string' ? parseInt(id) : id;
  if (isNaN(number)) return String(id);

  return number.toString();
}

export function formatCount(count: number | string): string {
  const number = typeof count === 'string' ? parseInt(count) : count;
  if (isNaN(number)) return '0';

  return number.toString();
}

export function serializeOrder(order: any): any {
  if (!order) return order;
  
  return {
    ...order,
    qty: typeof order.qty === 'bigint' ? order.qty.toString() : order.qty,
    remains: typeof order.remains === 'bigint' ? order.remains.toString() : order.remains,
    startCount: typeof order.startCount === 'bigint' ? order.startCount.toString() : order.startCount,
    minQty: order.minQty && typeof order.minQty === 'bigint' ? order.minQty.toString() : order.minQty,
    maxQty: order.maxQty && typeof order.maxQty === 'bigint' ? order.maxQty.toString() : order.maxQty,
  };
}

export function serializeService(service: any): any {
  if (!service) return service;
  
  return {
    ...service,
    min_order: typeof service.min_order === 'bigint' ? service.min_order.toString() : service.min_order,
    max_order: typeof service.max_order === 'bigint' ? service.max_order.toString() : service.max_order,
  };
}

export function serializeServices(services: any[]): any[] {
  if (!services || !Array.isArray(services)) return services;
  return services.map(serializeService);
}

export function detectTimezone(): string {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) {
        return timezone;
      }
    }
    
    if (typeof Date !== 'undefined') {
      const offset = -new Date().getTimezoneOffset();
      const hours = Math.floor(Math.abs(offset) / 60);
      const minutes = Math.abs(offset) % 60;
      const sign = offset >= 0 ? '+' : '-';
      
      const offsetString = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      const timezoneMap: Record<string, string> = {
        '+06:00': 'Asia/Dhaka',
        '+05:30': 'Asia/Kolkata',
        '+00:00': 'UTC',
        '+01:00': 'Europe/Berlin',
        '-05:00': 'America/New_York',
        '-08:00': 'America/Los_Angeles',
        '+09:00': 'Asia/Tokyo',
        '+08:00': 'Asia/Shanghai',
      };
      
      if (timezoneMap[offsetString]) {
        return timezoneMap[offsetString];
      }
    }
  } catch (error) {
    console.error('Error detecting timezone:', error);
  }
  
  return 'Asia/Dhaka';
}