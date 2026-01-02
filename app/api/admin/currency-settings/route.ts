import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const defaultCurrencySettings = {
  defaultCurrency: 'USD',
  displayDecimals: 2,
  currencyPosition: 'left',
  thousandsSeparator: ',',
  decimalSeparator: '.',
  updatedAt: new Date(),
};

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
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    rate: 150.0000,
    enabled: false,
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
  {
    code: 'XCD',
    name: 'East Caribbean Dollar',
    symbol: 'EC$',
    rate: 2.7000,
    enabled: true,
  },
];

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let currencySettings = await db.currencySettings.findFirst();
    if (!currencySettings) {
      currencySettings = await db.currencySettings.create({
        data: defaultCurrencySettings
      });
    }

    let currencies = await db.currencies.findMany({
      orderBy: { code: 'asc' }
    });

    if (currencies.length === 0) {
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
      currencies = await db.currencies.findMany({
        orderBy: { code: 'asc' }
      });
    }

    const formattedCurrencies = currencies.map(currency => ({
      ...currency,
      rate: Number(currency.rate)
    }));

    return NextResponse.json({
      success: true,
      currencySettings: {
        defaultCurrency: currencySettings.defaultCurrency,
        displayDecimals: currencySettings.displayDecimals,
        currencyPosition: currencySettings.currencyPosition,
        thousandsSeparator: currencySettings.thousandsSeparator,
        decimalSeparator: currencySettings.decimalSeparator,
      },
      currencies: formattedCurrencies
    });

  } catch (error) {
    console.error('Error loading currency settings:', error);
    return NextResponse.json(
      { error: 'Failed to load currency settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currencySettings, currencies } = await request.json();

    if (currencySettings) {
      try {
        await db.currencySettings.upsert({
          where: { id: 1 },
          update: {
            ...currencySettings,
            updatedAt: new Date()
          },
          create: { 
            id: 1, 
            ...currencySettings,
            updatedAt: new Date()
          }
        });
      } catch (settingsError) {
        console.error('Error saving currency settings:', settingsError);
        throw new Error(`Failed to save currency settings: ${settingsError instanceof Error ? settingsError.message : String(settingsError)}`);
      }
    }

    if (currencies && Array.isArray(currencies)) {
      for (const currency of currencies) {
        if (!currency.code || typeof currency.code !== 'string') {
          throw new Error(`Invalid currency code: ${currency.code}`);
        }
        if (!currency.name || typeof currency.name !== 'string') {
          throw new Error(`Invalid currency name for ${currency.code}`);
        }
        if (!currency.symbol || typeof currency.symbol !== 'string') {
          throw new Error(`Invalid currency symbol for ${currency.code}`);
        }
        if (currency.rate === undefined || currency.rate === null) {
          throw new Error(`Invalid currency rate for ${currency.code}`);
        }
      }

      const existingCurrencies = await db.currencies.findMany({
        select: { code: true }
      });

      const existingCodes = existingCurrencies.map(c => c.code);
      const newCodes = currencies.map(c => c.code);

      const codesToDelete = existingCodes.filter(code => !newCodes.includes(code));

      // Only USD is the core currency and cannot be deleted
      for (const codeToDelete of codesToDelete) {
        if (codeToDelete !== 'USD') {
          await db.currencies.delete({
            where: { code: codeToDelete }
          });
        } else {
          throw new Error('Cannot delete USD - it\'s the core currency');
        }
      }

      for (const currency of currencies) {
        // Prevent editing USD (core currency)
        if (currency.code === 'USD') {
          const existingUSD = await db.currencies.findUnique({
            where: { code: 'USD' }
          });
          
          if (existingUSD) {
            // Only allow updating enabled status for USD, not other fields
            await db.currencies.update({
              where: { code: 'USD' },
              data: {
                enabled: currency.enabled,
                updatedAt: new Date()
              }
            });
            continue; // Skip the upsert for USD
          }
        }

        const rateValue = typeof currency.rate === 'number' 
          ? currency.rate 
          : parseFloat(String(currency.rate)) || 1;

        if (isNaN(rateValue) || rateValue <= 0) {
          throw new Error(`Invalid rate value for ${currency.code}: ${currency.rate}`);
        }

        try {
          await db.currencies.upsert({
            where: { code: currency.code },
            update: {
              name: currency.name,
              symbol: currency.symbol,
              rate: rateValue,
              enabled: currency.enabled,
              updatedAt: new Date()
            },
            create: {
              code: currency.code,
              name: currency.name,
              symbol: currency.symbol,
              rate: rateValue,
              enabled: currency.enabled,
              updatedAt: new Date()
            }
          });
        } catch (dbError) {
          console.error(`Error upserting currency ${currency.code}:`, dbError);
          throw new Error(`Failed to save currency ${currency.code}: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Currency settings saved successfully'
    });

  } catch (error) {
    console.error('Error saving currency settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', errorDetails);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save currency settings',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
