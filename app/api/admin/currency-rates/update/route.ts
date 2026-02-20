import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Currency rates are managed through admin/settings/currency page');

    const currencies = await db.currencies.findMany({
      orderBy: { code: 'asc' }
    });
    
    if (currencies.length === 0) {
      return NextResponse.json({ 
        error: 'No currencies found in database' 
      }, { status: 404 });
    }

    const formattedCurrencies = currencies.map(currency => ({
      code: currency.code,
      name: currency.name,
      rate: Number(currency.rate),
      symbol: currency.symbol,
      enabled: currency.enabled
    }));

    return NextResponse.json({
      success: true,
      message: 'Currency rates are managed through the admin currency settings page',
      data: {
        currencies: formattedCurrencies,
        message: 'Please use the admin/settings/currency page to update exchange rates',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching currency rates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch currency rates',
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

    const formattedCurrencies = currencies.map(currency => ({
      ...currency,
      rate: Number(currency.rate)
    }));

    return NextResponse.json({
      success: true,
      data: formattedCurrencies
    });

  } catch (error) {
    console.error('Error fetching currency rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency rates' },
      { status: 500 }
    );
  }
}
