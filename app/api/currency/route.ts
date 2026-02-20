import { currentUser } from '@/lib/actions/auth';
import { updateUserCurrency } from '@/lib/actions/currency';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('=== Currency API Route Called ===');

  try {
    const user = await currentUser();
    console.log('Current user check:', user ? 'Found' : 'Not found');

    if (!user) {
      console.log('Currency API: Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currency } = await req.json();
    console.log('Currency API: Requested currency:', currency);

    let validCurrencies = ['USD', 'BDT', 'USDT'];

    try {
      const enabledCurrencies = await db.currencies.findMany({
        where: { enabled: true },
        select: { code: true }
      });
      validCurrencies = enabledCurrencies.map(c => c.code);
    } catch (error) {
      console.log('Currency API: Failed to load enabled currencies from DB, using fallback');
    }

    if (!validCurrencies.includes(currency)) {
      console.log('Currency API: Invalid currency:', currency);
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    console.log('Currency API: About to call updateUserCurrency');
    const success = await updateUserCurrency(currency);
    console.log('Currency API: updateUserCurrency result:', success);

    if (!success) {
      console.log('Currency API: Failed to update currency');
      return NextResponse.json(
        { error: 'Failed to update currency' },
        { status: 500 }
      );
    }

    console.log('Currency API: Success - returning response');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Currency API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
