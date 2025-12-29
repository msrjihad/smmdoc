'use server';
import { auth } from '@/auth';
import { getUserById } from '@/data/user';
import { db } from '@/lib/db';

export async function getUserCurrency() {
  const session = await auth();
  const user = await getUserById(session?.user?.id || '0');
  if (!user) return 'USD';
  return user.currency as 'USD' | 'BDT' | 'USDT';
}

export async function updateUserCurrency(currency: 'USD' | 'BDT' | 'USDT') {
  console.log('=== Currency Update Function Called ===');
  console.log('Requested currency:', currency);

  try {
    const session = await auth();
    console.log('Session check:', session ? 'Found' : 'Not found');

    if (!session) {
      console.log('Currency update failed: No session');
      return false;
    }

    console.log('Updating user currency:', {
      userId: session.user.id,
      newCurrency: currency,
      timestamp: new Date().toISOString()
    });

    const result = await db.users.update({
      where: { id: session?.user?.id },
      data: { currency },
    });

    console.log('Currency updated successfully:', result);
    console.log('=== Currency Update Complete ===');
    return true;
  } catch (error) {
    console.error('=== Currency Update Error ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return false;
  }
}
