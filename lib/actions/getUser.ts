
'use server';

import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '../db';

export async function getUserDetails() {
  try {

    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return null;
    }

    try {

      const user = await db.users.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          image: true,
          emailVerified: true,
          currency: true,
          isTwoFactorEnabled: true,
          balance: true,
          total_deposit: true,
          total_spent: true,
          apiKey: true,
          language: true,
          timezone: true,
          timeFormat: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        ...user,

        balance: user.balance || 0,
        total_deposit: user.total_deposit || 0,
        total_spent: user.total_spent || 0
      };
    } catch (dbError) {
      console.error("Database error:", dbError);

      try {

        const userBasic = await db.users.findUnique({
          where: {
            id: session.user.id,
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            image: true,
            emailVerified: true,
            currency: true,
            isTwoFactorEnabled: true,
            balance: true,
            total_deposit: true,
            total_spent: true,
            apiKey: true,
            language: true,
            timezone: true,
            timeFormat: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!userBasic) {
          return null;
        }

        const transactions = await db.addFunds.findMany({
          where: {
            userId: session.user.id,
          },
        });

        return {
          ...userBasic,
          addFund: transactions,
          balance: userBasic.balance || 0,
          total_deposit: userBasic.total_deposit || 0,
          total_spent: userBasic.total_spent || 0
        };
      } catch (fallbackError) {
        console.error("Fallback fetch failed:", fallbackError);

        return {
          id: session.user.id,
          name: session.user.name || null,
          email: session.user.email || null,
          role: session.user.role || 'user',
          image: session.user.image || null,
          emailVerified: null,
          currency: session.user.currency || 'USD',
          isTwoFactorEnabled: session.user.isTwoFactorEnabled || false,
          total_deposit: 0,
          total_spent: 0,
          username: session.user.username || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          addFund: []
        };
      }
    }
  } catch (error) {
    console.error("Error getting user details:", error);
    return null;
  }
}
