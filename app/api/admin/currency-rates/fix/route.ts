import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const CORRECT_RATES = {
  USD: 1.0000,
  BDT: 110.0000,
  XCD: 2.7000,
  USDT: 1.0000,
  EUR: 0.8500,
  GBP: 0.7300,
  JPY: 150.0000,
  CAD: 1.3500,
  AUD: 1.5000,
};

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('ðŸ”§ Fixing currency rates manually...');

    const updatedCurrencies = [];

    for (const [currencyCode, correctRate] of Object.entries(CORRECT_RATES)) {
      try {
        const existingCurrency = await db.currencies.findUnique({
          where: { code: currencyCode }
        });

        if (existingCurrency) {
          const updatedCurrency = await db.currencies.update({
            where: { code: currencyCode },
            data: { rate: correctRate },
          });

          updatedCurrencies.push({
            code: currencyCode,
            oldRate: Number(existingCurrency.rate),
            newRate: correctRate,
            action: 'updated'
          });

          console.log(`âœ… ${currencyCode}: ${Number(existingCurrency.rate)} â†’ ${correctRate}`);
        } else {
          console.log(`âš ï¸ Currency ${currencyCode} not found in database`);
        }
      } catch (error) {
        console.error(`âŒ Error updating ${currencyCode}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Currency rates fixed successfully',
      data: {
        updatedCurrencies,
        totalUpdated: updatedCurrencies.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('âŒ Error fixing currency rates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix currency rates',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currencies = await db.currencies.findMany({
      orderBy: { code: 'asc' }
    });

    const comparison = currencies.map(currency => ({
      code: currency.code,
      currentRate: Number(currency.rate),
      correctRate: CORRECT_RATES[currency.code as keyof typeof CORRECT_RATES] || 'N/A',
      needsUpdate: CORRECT_RATES[currency.code as keyof typeof CORRECT_RATES] 
        ? Number(currency.rate) !== CORRECT_RATES[currency.code as keyof typeof CORRECT_RATES]
        : false
    }));

    return NextResponse.json({
      success: true,
      data: {
        currencies: comparison,
        needsUpdate: comparison.filter(c => c.needsUpdate).length
      }
    });

  } catch (error) {
    console.error('Error checking currency rates:', error);
    return NextResponse.json(
      { error: 'Failed to check currency rates' },
      { status: 500 }
    );
  }
}
