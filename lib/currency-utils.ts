
export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: number;
  enabled: boolean;
}

export interface CurrencySettings {
  id: number;
  defaultCurrency: string;
  displayDecimals: number;
  currencyPosition: 'left' | 'right' | 'left_space' | 'right_space';
  thousandsSeparator: string;
  decimalSeparator: string;
}
let currencyCache: {
  currencies: Currency[];
  settings: CurrencySettings;
  lastFetch: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000;
export async function fetchCurrencyData(): Promise<{
  currencies: Currency[];
  settings: CurrencySettings;
}> {
  if (currencyCache && Date.now() - currencyCache.lastFetch < CACHE_DURATION) {
    return {
      currencies: currencyCache.currencies,
      settings: currencyCache.settings,
    };
  }

  const isServerSide = typeof window === 'undefined';

  try {
    let currenciesData: any;
    let settingsData: any = { success: false, currencySettings: null };

    if (isServerSide) {

      const { db } = await import('@/lib/db');

      const enabledCurrencies = await db.currencies.findMany({
        where: { enabled: true },
        orderBy: { code: 'asc' }
      });

      currenciesData = {
        success: true,
        currencies: enabledCurrencies.map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          rate: Number(c.rate),
          enabled: c.enabled
        }))
      };

      try {
        const currencySettings = await db.currencySettings.findFirst();
        if (currencySettings) {
          settingsData = {
            success: true,
            currencySettings: {
              id: currencySettings.id,
              defaultCurrency: currencySettings.defaultCurrency,
              displayDecimals: currencySettings.displayDecimals,
              currencyPosition: currencySettings.currencyPosition,
              thousandsSeparator: currencySettings.thousandsSeparator,
              decimalSeparator: currencySettings.decimalSeparator,
            }
          };
        }
      } catch (settingsError) {
        console.log('Currency settings: Using fallback due to error:', settingsError);
      }
    } else {
      const baseUrl = window.location.origin;

      const currenciesResponse = await fetch(`${baseUrl}/api/currencies/enabled`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!currenciesResponse.ok) {
        throw new Error(`Failed to fetch currencies: ${currenciesResponse.status}`);
      }

      currenciesData = await currenciesResponse.json();

      try {
        let settingsResponse = await fetch(`${baseUrl}/api/admin/currency-settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (settingsResponse.ok) {
          settingsData = await settingsResponse.json();
        } else if (settingsResponse.status === 401) {
          settingsResponse = await fetch(`${baseUrl}/api/public/currency-settings`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (settingsResponse.ok) {
            settingsData = await settingsResponse.json();
          }
        } else {
          throw new Error(`Failed to fetch currency settings: ${settingsResponse.status}`);
        }
      } catch (error) {
        console.log('Currency settings: Using fallback due to error:', error);
      }
    }

    const currencies = currenciesData.success ? currenciesData.currencies : [];
    const settings = settingsData.success && settingsData.currencySettings ? settingsData.currencySettings : {
      id: 1,
      defaultCurrency: 'USD',
      displayDecimals: 2,
      currencyPosition: 'left' as const,
      thousandsSeparator: ',',
      decimalSeparator: '.',
    };
    currencyCache = {
      currencies,
      settings,
      lastFetch: Date.now(),
    };

    return { currencies, settings };
  } catch (error) {
    console.error('Error fetching currency data:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    const fallbackCurrencies: Currency[] = [
      { id: 1, code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0000, enabled: true },
      { id: 2, code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85, enabled: true },
      { id: 3, code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73, enabled: true },
      { id: 4, code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0, enabled: true },
      { id: 5, code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 110.0000, enabled: true },
      { id: 6, code: 'USDT', name: 'Tether USD', symbol: '₮', rate: 1.0000, enabled: true },
    ];

    const fallbackSettings: CurrencySettings = {
      id: 1,
      defaultCurrency: 'USD',
      displayDecimals: 2,
      currencyPosition: 'left',
      thousandsSeparator: ',',
      decimalSeparator: '.',
    };
    currencyCache = {
      currencies: fallbackCurrencies,
      settings: fallbackSettings,
      lastFetch: Date.now(),
    };

    return {
      currencies: fallbackCurrencies,
      settings: fallbackSettings,
    };
  }
}
export function formatNumberWithSettings(
  amount: number,
  settings: CurrencySettings
): string {
  const { displayDecimals, thousandsSeparator, decimalSeparator } = settings;
  const parts = amount.toFixed(displayDecimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  return parts.join(decimalSeparator);
}

export function formatCurrencyAmount(
  amount: number,
  currencyCode: string,
  currencies: Currency[],
  settings: CurrencySettings
): string {
  const currency = currencies.find(c => c.code === currencyCode);
  if (!currency) {
    return formatNumberWithSettings(amount, settings);
  }

  const { symbol } = currency;
  const { displayDecimals, currencyPosition, thousandsSeparator, decimalSeparator } = settings;
  const parts = amount.toFixed(displayDecimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  const formattedAmount = parts.join(decimalSeparator);
  switch (currencyPosition) {
    case 'left':
      return `${symbol}${formattedAmount}`;
    case 'right':
      return `${formattedAmount}${symbol}`;
    case 'left_space':
      return `${symbol} ${formattedAmount}`;
    case 'right_space':
      return `${formattedAmount} ${symbol}`;
    default:
      return `${symbol}${formattedAmount}`;
  }
}
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  currencies: Currency[]
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  const toCurrencyData = currencies.find(c => c.code === toCurrency);

  console.log('Currency conversion debug:', {
    amount,
    fromCurrency,
    toCurrency,
    fromCurrencyData: fromCurrencyData ? { code: fromCurrencyData.code, rate: fromCurrencyData.rate } : null,
    toCurrencyData: toCurrencyData ? { code: toCurrencyData.code, rate: toCurrencyData.rate } : null
  });

  if (!fromCurrencyData || !toCurrencyData) {
    console.warn('Currency not found, returning original amount');
    return amount;
  }
  let convertedAmount: number;

  if (fromCurrency === 'USD') {
    convertedAmount = amount * Number(toCurrencyData.rate);
  } else if (toCurrency === 'USD') {
    convertedAmount = amount / Number(fromCurrencyData.rate);
  } else {
    const usdAmount = amount / Number(fromCurrencyData.rate);
    convertedAmount = usdAmount * Number(toCurrencyData.rate);
  }

  console.log('Conversion result:', { original: amount, converted: convertedAmount });
  return convertedAmount;
}
export function getCurrencyByCode(code: string, currencies: Currency[]): Currency | null {
  return currencies.find(c => c.code === code) || null;
}
export function clearCurrencyCache(): void {
  currencyCache = null;
}

export function convertToUSD(
  amount: number,
  fromCurrency: string,
  currencies: Currency[]
): number {
  if (fromCurrency === 'USD') {
    return amount;
  }

  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  if (!fromCurrencyData) {
    console.warn(`Currency ${fromCurrency} not found, treating as USD`);
    return amount;
  }
  return amount / Number(fromCurrencyData.rate);
}

export function convertFromUSD(
  amountUSD: number,
  toCurrency: string,
  currencies: Currency[]
): number {
  if (toCurrency === 'USD') {
    return amountUSD;
  }

  const toCurrencyData = currencies.find(c => c.code === toCurrency);
  if (!toCurrencyData) {
    console.warn(`Currency ${toCurrency} not found, returning USD amount`);
    return amountUSD;
  }
  return amountUSD * Number(toCurrencyData.rate);
}

export async function formatCurrencyWithConversion(
  amountUSD: number,
  displayCurrency: string,
  showOriginalUSD: boolean = false
): Promise<string> {
  try {
    const { currencies, settings } = await fetchCurrencyData();
    const convertedAmount = convertFromUSD(amountUSD, displayCurrency, currencies);
    const formattedAmount = formatCurrencyAmount(convertedAmount, displayCurrency, currencies, settings);

    if (showOriginalUSD && displayCurrency !== 'USD') {
      const formattedUSD = formatCurrencyAmount(amountUSD, 'USD', currencies, settings);
      return `${formattedAmount} (${formattedUSD})`;
    }

    return formattedAmount;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${amountUSD.toFixed(2)}`;
  }
}

export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  currencies: Currency[]
): number {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  const toCurrencyData = currencies.find(c => c.code === toCurrency);

  if (!fromCurrencyData || !toCurrencyData) {
    return 1;
  }

  if (fromCurrency === 'USD') {
    return Number(toCurrencyData.rate);
  } else if (toCurrency === 'USD') {
    return 1 / Number(fromCurrencyData.rate);
  } else {
    return Number(toCurrencyData.rate) / Number(fromCurrencyData.rate);
  }
}
