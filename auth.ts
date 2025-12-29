
import authConfig from '@/auth.config';
import { CustomAdapter } from '@/lib/custom-adapter';
import NextAuth from 'next-auth';
import { db } from './lib/db';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  events: {
    async linkAccount({ user }: any) {

      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      if (!isNaN(userId)) {

        const existingUser = await db.users.findUnique({
          where: { id: userId },
          select: { balance: true, total_deposit: true }
        });

        const userSettings = await db.userSettings.findFirst();
        let initialBalance = 0;

        if (userSettings?.freeAmount && userSettings.freeAmount > 0) {
          initialBalance = userSettings.freeAmount;
        }

        const emailConfirmationEnabled = userSettings?.emailConfirmationEnabled ?? true;

        const updateData: any = {};

        if (emailConfirmationEnabled) {
          updateData.emailVerified = new Date();
        } else {

          updateData.emailVerified = new Date();
        }

        if (existingUser && existingUser.balance === 0 && existingUser.total_deposit === 0 && initialBalance > 0) {
          updateData.balance = initialBalance;
          updateData.total_deposit = initialBalance;
        }

        await db.users.update({
          where: { id: userId },
          data: updateData,
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  adapter: CustomAdapter(),
  session: { strategy: 'jwt' },
  ...authConfig,
});
