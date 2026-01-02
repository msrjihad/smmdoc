
'use client';
import { useCurrency } from '@/contexts/currency-context';
import { formatPrice } from '@/lib/utils';
import { convertCurrency } from '@/lib/currency-utils';

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
  const { currency, availableCurrencies, isLoading, currentCurrencyData } = useCurrency();

  if (isLoading || !availableCurrencies.length) {
    return (
      <span className={className}>
        ${formatPrice(amount, 2)}
      </span>
    );
  }

  if (currency === originalCurrency) {
    const symbol = currentCurrencyData?.symbol || (originalCurrency === 'USD' ? '$' : '৳');
    return (
      <span className={className}>
        {symbol}{formatPrice(amount, 2)}
      </span>
    );
  }

  const convertedAmount = convertCurrency(amount, originalCurrency, currency, availableCurrencies);
  const displaySymbol = currentCurrencyData?.symbol || '$';

  return (
    <span className={className}>
      {displaySymbol}{formatPrice(convertedAmount, 2)}
    </span>
  );
}
