'use client';
import { useCurrency } from '@/contexts/currency-context';
import { formatPrice } from '@/lib/utils';
import { convertCurrency, formatCurrencyAmount } from '@/lib/currency-utils';

interface PriceDisplayProps {
  amount: number;
  originalCurrency: 'USD' | 'BDT';
  className?: string;
}

export function PriceDisplay({
  amount,
  originalCurrency,
  className,
}: PriceDisplayProps) {
  const { currency, availableCurrencies, currencySettings, isLoading, currentCurrencyData } = useCurrency();

  const displayCurrencyCode = currency === originalCurrency ? originalCurrency : currency;
  const displayAmount = currency === originalCurrency
    ? amount
    : convertCurrency(amount, originalCurrency, currency, availableCurrencies);

  if (currencySettings && availableCurrencies.length > 0) {
    const currencyData = availableCurrencies.find(c => c.code === displayCurrencyCode);
    if (currencyData) {
      return (
        <span className={className}>
          {formatCurrencyAmount(displayAmount, displayCurrencyCode, availableCurrencies, currencySettings)}
        </span>
      );
    }
  }

  if (isLoading || !availableCurrencies.length) {
    return (
      <span className={className}>
        ${formatPrice(amount, 2)}
      </span>
    );
  }

  const symbol = currentCurrencyData?.symbol || (originalCurrency === 'USD' ? '$' : '৳');
  return (
    <span className={className}>
      {symbol}{formatPrice(displayAmount, 2)}
    </span>
  );
}
