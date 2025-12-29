
'use client';
import { useCurrency } from '@/contexts/currency-context';
import { formatPrice } from '@/lib/utils';

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
  const { currency, availableCurrencies, isLoading } = useCurrency();

  if (isLoading || !availableCurrencies.length) {
    return (
      <span className={className}>
        ${formatPrice(amount, 2)}
      </span>
    );
  }

  const currentCurrencyData = availableCurrencies.find(c => c.code === currency);

  if (currency === 'USD' || !currentCurrencyData) {
    return (
      <span className={className}>
        ${formatPrice(amount, 2)}
      </span>
    );
  }

  const displayAmount = amount * Number(currentCurrencyData.rate);
  const displaySymbol = currentCurrencyData.symbol;

  return (
    <span className={className}>
      {displaySymbol}{formatPrice(displayAmount, 2)}
    </span>
  );
}
