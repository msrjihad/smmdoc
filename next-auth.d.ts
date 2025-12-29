import { Role } from '@prisma/client';
import { DefaultSession } from 'next-auth';

export type ExtendedUser = DefaultSession['user'] & {
  role: Role;
  isTwoFactorEnabled: boolean;
  id: number;
  email: string;
  name: string;
  currency: string;
  username?: string;
  isImpersonating?: boolean;
  originalAdminId?: number;
  permissions?: string[] | null;
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
}
