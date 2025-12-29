'use client';

import { useCurrency as useContextCurrency } from '@/contexts/currency-context';

export default function useCurrency() {
  return useContextCurrency();
} 