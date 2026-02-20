import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const enabledCurrencies = await db.currencies.findMany({
      where: {
        enabled: true
      },
      orderBy: {
        code: 'asc'
      }
    });

    if (enabledCurrencies.length === 0) {
      const defaultCurrencies = [
        {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          rate: 1.0000,
          enabled: true,
        },
        {
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          rate: 0.8500,
          enabled: true,
        },
        {
          code: 'GBP',
          name: 'British Pound',
          symbol: '£',
          rate: 0.7300,
          enabled: true,
        },
        {
          code: 'BDT',
          name: 'Bangladeshi Taka',
          symbol: '৳',
          rate: 110.0000,
          enabled: true,
        },
        {
          code: 'USDT',
          name: 'Tether USD',
          symbol: '₮',
          rate: 1.0000,
          enabled: true,
        },
      ];

      for (const currency of defaultCurrencies) {
        await db.currencies.upsert({
          where: { code: currency.code },
          update: {
            name: currency.name,
            symbol: currency.symbol,
            rate: currency.rate,
            enabled: currency.enabled
          },
          create: {
            ...currency,
            updatedAt: new Date()
          }
        });
      }

      const seededCurrencies = await db.currencies.findMany({
        where: { enabled: true },
        orderBy: { code: 'asc' }
      });

      const formattedSeeded = seededCurrencies.map(currency => ({
        ...currency,
        rate: Number(currency.rate)
      }));

      return NextResponse.json({
        success: true,
        currencies: formattedSeeded
      });
    }

    const formattedCurrencies = enabledCurrencies.map(currency => ({
      ...currency,
      rate: Number(currency.rate)
    }));

    return NextResponse.json({
      success: true,
      currencies: formattedCurrencies
    });

  } catch (error) {
    console.error('Error loading enabled currencies:', error);

    const fallbackCurrencies = [
      { id: 1, code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0000, enabled: true },
      { id: 5, code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 110.0000, enabled: true },
      { id: 6, code: 'USDT', name: 'Tether USD', symbol: '₮', rate: 1.0000, enabled: true },
    ];

    return NextResponse.json({
      success: true,
      currencies: fallbackCurrencies
    });
  }
}
