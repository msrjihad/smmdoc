'use server';
import { auth } from '@/auth';
import { getUserById } from '@/data/user';
import { db } from '@/lib/db';

export async function getUserCurrency(): Promise<string> {
  const session = await auth();
  const user = await getUserById(session?.user?.id || '0');
  if (user?.currency) return user.currency;
  const currencySettings = await db.currencySettings.findFirst();
  return currencySettings?.defaultCurrency ?? 'USD';
}

export async function updateUserCurrency(currency: string): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) return false;

    const allowed = await db.currencies.findFirst({
      where: { code: currency, enabled: true },
    });
    if (!allowed) return false;

    await db.users.update({
      where: { id: session.user.id },
      data: { currency: allowed.code },
    });
    return true;
  } catch {
    return false;
  }
}
