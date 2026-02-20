
import axiosInstance from './axios-instance';
import { convertCurrency, formatCurrencyAmount, Currency, CurrencySettings } from './currency-utils';

export interface ParsedOrder {
  lineNumber: number;
  serviceId: string;
  link: string;
  quantity: number;
  valid: boolean;
  errors: string[];
  service?: ServiceDetails;
  price?: number;
  priceInUserCurrency?: number;
}

export interface ServiceDetails {
  id: number;
  name: string;
  rate: number;
  min_order: number;
  max_order: number;
  categoryId: string;
  status: string;
}

export interface ValidationResult {
  orders: ParsedOrder[];
  validOrders: ParsedOrder[];
  invalidOrders: ParsedOrder[];
  totalCost: number;
  totalCostInUserCurrency: number;
  currency: string;
  currencyRate: number;
}

export function parseMassOrderInput(input: string): ParsedOrder[] {
  if (!input.trim()) return [];

  return input
    .split('\n')
    .map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;

      const parts = trimmedLine.split('|').map(p => p.trim());

      return {
        lineNumber: index + 1,
        serviceId: parts[0] || '',
        link: parts[1] || '',
        quantity: parseInt(parts[2]) || 0,
        valid: false,
        errors: []
      };
    })
    .filter(Boolean) as ParsedOrder[];
}

async function validateOrder(
  order: ParsedOrder,
  userCurrency: string,
  availableCurrencies: Array<{ code: string; rate: number; symbol: string; name: string }>,
  servicesDiscount: number = 0
): Promise<ParsedOrder> {
  const errors: string[] = [];

  if (!order.serviceId) {
    errors.push('Service ID is required');
  }

  if (!order.link) {
    errors.push('Link is required');
  }

  if (!order.quantity || order.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (order.link && !order.link.startsWith('http')) {
    errors.push('Link must start with http or https');
  }

  if (errors.length > 0) {
    return {
      ...order,
      valid: false,
      errors
    };
  }

  try {

    const serviceResponse = await axiosInstance.get(
      `/api/user/services/serviceById?svId=${order.serviceId}`
    );

    const service = serviceResponse.data.data;

    if (!service) {
      errors.push(`Service ${order.serviceId} not found`);
      return {
        ...order,
        valid: false,
        errors
      };
    }

    if (service.status !== 'active') {
      errors.push(`Service ${order.serviceId} is not active`);
      return {
        ...order,
        valid: false,
        errors,
        service
      };
    }

    if (order.quantity < service.min_order) {
      errors.push(`Minimum quantity is ${service.min_order}`);
    }

    if (order.quantity > service.max_order) {
      errors.push(`Maximum quantity is ${service.max_order}`);
    }

    const effectiveRate = servicesDiscount <= 0 ? service.rate : service.rate * (1 - servicesDiscount / 100);
    const price = (effectiveRate * order.quantity) / 1000;
    const currencies: Currency[] = availableCurrencies.map((c, index) => ({
      id: index + 1,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      rate: c.rate,
      enabled: true
    }));
    const priceInUserCurrency = convertCurrency(price, 'USD', userCurrency, currencies);

    return {
      ...order,
      valid: errors.length === 0,
      errors,
      service,
      price,
      priceInUserCurrency
    };
  } catch {
      errors.push(`Failed to validate service ${order.serviceId}`);
      return {
        ...order,
        valid: false,
        errors
      };
    }
}

export async function validateMassOrders(
  input: string,
  userCurrency: string,
  availableCurrencies: Array<{ code: string; rate: number; symbol: string; name: string }>,
  servicesDiscount: number = 0
): Promise<ValidationResult> {
  const parsedOrders = parseMassOrderInput(input);

  if (parsedOrders.length === 0) {
    return {
      orders: [],
      validOrders: [],
      invalidOrders: [],
      totalCost: 0,
      totalCostInUserCurrency: 0,
      currency: userCurrency,
      currencyRate: 1
    };
  }

  const validatedOrders = await Promise.all(
    parsedOrders.map(order => validateOrder(order, userCurrency, availableCurrencies, servicesDiscount))
  );

  const validOrders = validatedOrders.filter(order => order.valid);
  const invalidOrders = validatedOrders.filter(order => !order.valid);

  const totalCost = validOrders.reduce((sum, order) => sum + (order.price || 0), 0);
  const totalCostInUserCurrency = validOrders.reduce((sum, order) => sum + (order.priceInUserCurrency || 0), 0);

  return {
    orders: validatedOrders,
    validOrders,
    invalidOrders,
    totalCost,
    totalCostInUserCurrency,
    currency: userCurrency,
    currencyRate: availableCurrencies.find(c => c.code === userCurrency)?.rate || 1
  };
}

export function formatValidationErrors(result: ValidationResult): string[] {
  const errors: string[] = [];

  result.invalidOrders.forEach((orderResult) => {
    if (orderResult.errors.length > 0) {
      errors.push(`Line ${orderResult.lineNumber}: ${orderResult.errors.join(', ')}`);
    }
  });

  return errors;
}

export function checkSufficientBalance(
  validationResult: ValidationResult,
  userBalance: number,
  availableCurrencies: Array<{ code: string; rate: number; symbol: string; name: string }> = [],
  currencySettings: { format?: string; decimals: number; decimal_separator: string; thousand_separator: string; currencyPosition?: 'left' | 'right' | 'left_space' | 'right_space' } | null = null
): {
  sufficient: boolean;
  required: number;
  available: number;
  message?: string;
} {
  const required = validationResult.totalCostInUserCurrency;
  const available = userBalance;
  const sufficient = available >= required;

  const formatAmount = (amount: number, currency: string) => {
    if (currencySettings && availableCurrencies.length > 0) {
      const currencies: Currency[] = availableCurrencies.map((c, index) => ({
        id: index + 1,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        rate: c.rate,
        enabled: true
      }));
      const settings: CurrencySettings = {
        id: 1,
        defaultCurrency: currency,
        displayDecimals: currencySettings.decimals,
        currencyPosition: (currencySettings.currencyPosition || 'left') as 'left' | 'right' | 'left_space' | 'right_space',
        thousandsSeparator: currencySettings.thousand_separator,
        decimalSeparator: currencySettings.decimal_separator
      };
      return formatCurrencyAmount(amount, currency, currencies, settings);
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  return {
    sufficient,
    required,
    available,
    message: sufficient ? undefined : `Insufficient balance. Available: ${formatAmount(available, validationResult.currency)}, Required: ${formatAmount(required, validationResult.currency)}`
  };
}

export function convertToApiFormat(
  validationResult: ValidationResult,
  batchId: string
): Array<{
  categoryId: number;
  serviceId: number;
  link: string;
  qty: number;
}> {
  return validationResult.validOrders.map(order => {
    const catId = order.service?.categoryId;
    const categoryId = catId != null && catId !== '' ? parseInt(String(catId)) : 0;
    if (!categoryId) {
      console.warn('Mass order: missing categoryId for service', order.serviceId, order.service);
    }
    return {
      categoryId,
      serviceId: parseInt(order.serviceId),
      link: order.link,
      qty: order.quantity
    };
  });
}