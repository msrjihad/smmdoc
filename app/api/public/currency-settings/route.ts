import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const currencySettings = await db.currencySettings.findFirst();

    if (!currencySettings) {
      return NextResponse.json({
        success: true,
        currencySettings: {
          id: 1,
          defaultCurrency: 'USD',
          displayDecimals: 2,
          currencyPosition: 'left',
          thousandsSeparator: ',',
          decimalSeparator: '.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      currencySettings: {
        id: currencySettings.id,
        defaultCurrency: currencySettings.defaultCurrency,
        displayDecimals: currencySettings.displayDecimals,
        currencyPosition: currencySettings.currencyPosition,
        thousandsSeparator: currencySettings.thousandsSeparator,
        decimalSeparator: currencySettings.decimalSeparator,
      },
    });
  } catch (error) {
    console.error('Error fetching public currency settings:', error);
    return NextResponse.json(
      {
        success: false,
        currencySettings: {
          id: 1,
          defaultCurrency: 'USD',
          displayDecimals: 2,
          currencyPosition: 'left',
          thousandsSeparator: ',',
          decimalSeparator: '.',
        },
      },
      { status: 500 }
    );
  }
}
