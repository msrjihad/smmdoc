
'use client';

import {
    clearCurrencyCache,
    convertCurrency,
    Currency,
    CurrencySettings,
    fetchCurrencyData,
    formatCurrencyAmount
} from '@/lib/currency-utils';
import { createContext, useContext, useEffect, useMemo, useCallback, useRef, useState } from 'react';

type CurrencyContextType = {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  rate: number | null;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  convertAmount: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  availableCurrencies: Currency[];
  currentCurrencyData: Currency | null;
  currencySettings: CurrencySettings | null;
  refreshCurrencyData: () => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: async () => {},
  rate: null,
  isLoading: true,
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  convertAmount: (amount: number) => amount,
  availableCurrencies: [],
  currentCurrencyData: null,
  currencySettings: null,
  refreshCurrencyData: async () => {},
});

export function CurrencyProvider({
  children,
  serverCurrency,
}: {
  children: React.ReactNode;
  serverCurrency?: string;
}) {
  const [currency, setCurrencyState] = useState<string>(
    serverCurrency || 'USD'
  );
  const [rate, setRate] = useState<number | null>(121.45);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [currentCurrencyData, setCurrentCurrencyData] = useState<Currency | null>(null);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);

  const loadCurrencyData = async () => {
    try {
      setIsLoading(true);
      const { currencies, settings } = await fetchCurrencyData();
      setAvailableCurrencies(currencies);
      setCurrencySettings(settings);

      setCurrencyState((prev) => {
        const isAvailable = currencies.some((c) => c.code === prev);
        return isAvailable ? prev : (settings.defaultCurrency || 'USD');
      });

      console.log('Currency data loaded successfully:', {
        currenciesCount: currencies.length,
        defaultCurrency: settings.defaultCurrency
      });
    } catch (error) {
      console.error('Error loading currency data:', error);

      const fallbackCurrencies: Currency[] = [
        { id: 1, code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0000, enabled: true },
      ];

      const fallbackSettings: CurrencySettings = {
        id: 1,
        defaultCurrency: 'USD',
        displayDecimals: 2,
        currencyPosition: 'left',
        thousandsSeparator: ',',
        decimalSeparator: '.',
      };

      setAvailableCurrencies(fallbackCurrencies);
      setCurrencySettings(fallbackSettings);

      console.log('Using fallback currency data due to fetch error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCurrencyData = useCallback(async () => {
    clearCurrencyCache();
    await loadCurrencyData();

  }, []);

  useEffect(() => {
    loadCurrencyData();
  }, []);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('currency') as string | null;
      if (savedCurrency && !serverCurrency) {
        setCurrencyState(savedCurrency);
      }
    }
  }, [serverCurrency]);

  useEffect(() => {
    if (availableCurrencies.length > 0) {
      const currencyData = availableCurrencies.find(c => c.code === currency);
      setCurrentCurrencyData(currencyData || null);

      const usdData = availableCurrencies.find(c => c.code === 'USD');
      const bdtData = availableCurrencies.find(c => c.code === 'BDT');

      if (usdData && bdtData) {

        const usdToBdtRate = Number(bdtData.rate) / Number(usdData.rate);
        setRate(usdToBdtRate);
      } else if (currencyData) {
        setRate(currencyData.rate);
      }
    }
  }, [currency, availableCurrencies]);

  const setCurrency = useCallback(async (newCurrency: string) => {
    try {

      const isAvailable = availableCurrencies.some(c => c.code === newCurrency);
      if (!isAvailable) {
        console.error('Currency not available:', newCurrency);
        console.log('Available currencies:', availableCurrencies.map(c => c.code));
        return;
      }

      setCurrencyState(newCurrency);
      if (typeof window !== 'undefined') {
        localStorage.setItem('currency', newCurrency);
      }

      try {
        const response = await fetch('/api/currency', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currency: newCurrency }),
        });

        if (!response.ok) {
          console.warn('Failed to update currency preference on server:', response.status);
        }
      } catch (serverError) {
        console.warn('Server currency update failed, but local preference saved:', serverError);
      }
    } catch (error) {
      console.error('Failed to update currency:', error);

      const savedCurrency = typeof window !== 'undefined' ? localStorage.getItem('currency') : null;
      if (savedCurrency && savedCurrency !== newCurrency) {
        setCurrencyState(savedCurrency);
      }
    }
  }, [availableCurrencies]);

  const formatCurrency = useCallback((amount: number): string => {
    if (!currentCurrencyData || !currencySettings) {
      return `$${amount.toFixed(2)}`;
    }

    const convertedAmount = convertCurrency(amount, 'BDT', currentCurrencyData.code, availableCurrencies);

    return formatCurrencyAmount(convertedAmount, currentCurrencyData.code, availableCurrencies, currencySettings);
  }, [currentCurrencyData, currencySettings, availableCurrencies]);

  const convertAmount = useCallback((amount: number, fromCurrency?: string, toCurrency?: string): number => {
    if (!fromCurrency || !toCurrency) {
      return amount;
    }
    return convertCurrency(amount, fromCurrency, toCurrency, availableCurrencies);
  }, [availableCurrencies]);

  const renderCountRef = useRef(0);
  useEffect(() => {
    renderCountRef.current += 1;
    if (process.env.NODE_ENV === 'development' && renderCountRef.current % 20 === 0) {
      console.warn('[CurrencyProvider] high render count:', renderCountRef.current);
    }
  });

  const fallbackValue = useMemo(() => ({
    currency: serverCurrency || 'USD',
    setCurrency,
    rate,
    isLoading: true,
    formatCurrency,
    convertAmount,
    availableCurrencies: [],
    currentCurrencyData: null,
    currencySettings: null,
    refreshCurrencyData
  }), [serverCurrency, setCurrency, rate, formatCurrency, convertAmount, refreshCurrencyData]);

  const contextValue = useMemo(() => ({
    currency,
    setCurrency,
    rate,
    isLoading,
    formatCurrency,
    convertAmount,
    availableCurrencies,
    currentCurrencyData,
    currencySettings,
    refreshCurrencyData
  }), [currency, setCurrency, rate, isLoading, formatCurrency, convertAmount, availableCurrencies, currentCurrencyData, currencySettings, refreshCurrencyData]);

  const value = isClient ? contextValue : fallbackValue;

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
