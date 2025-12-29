
import { user_role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { getTwoFactorConfirmationByUserId } from './data/two-factor-confirmation';
import { getUserByEmail, getUserById, getUserByUsername } from './data/user';
import { ActivityLogger } from './lib/activity-logger';
import { db } from './lib/db';
import { signInSchema } from './lib/validators/auth.validator';
import { processAffiliateReferral } from './lib/affiliate-referral-helper';

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials): Promise<any> {
        const validedFields = signInSchema.safeParse(credentials);
        if (validedFields.success) {
          const { email, password } = validedFields.data;

          const isEmail = email.includes('@');

          const user = isEmail
            ? await getUserByEmail(email)
            : await getUserByUsername(email);

          if (!user || !user.password) return null;

          if (password && password.startsWith('VERIFICATION_TOKEN:')) {
            const verificationCode = password.replace('VERIFICATION_TOKEN:', '');
            const { getVerificationTokenByToken } = await import('./data/verification-token');
            const verificationToken = await getVerificationTokenByToken(verificationCode);
            
            if (verificationToken && 
                verificationToken.email === user.email && 
                new Date(verificationToken.expires) > new Date()) {
              return user;
            }
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, request }: any) {

      if (account?.provider !== 'credentials') return true;
      const existingUser = await getUserById(user.id);
      if (!existingUser) return false;

      if (existingUser.status === 'banned') {
        console.log(`Blocked login attempt for banned user: ${existingUser.email}`);
        return false;
      }

      if (existingUser.status === 'suspended') {
        console.log(`Blocked login attempt for suspended user: ${existingUser.email}`);
        return false;
      }















      console.log(`Successful login: ${existingUser.email} (Role: ${existingUser.role})`);

      try {
        const username = existingUser.username || existingUser.email?.split('@')[0] || `user${existingUser.id}`;


        if (existingUser.role === 'admin') {
          await ActivityLogger.adminLogin(existingUser.id, username, 'unknown');
        } else {
          await ActivityLogger.login(existingUser.id, username, 'unknown');
        }
      } catch (error) {
        console.error('Failed to log activity:', error);
      }

      return true;
    },

    async session({ token, session }: any) {
      if (token.sub && session.user) {

        const numericId = parseInt(token.sub);
        if (!isNaN(numericId)) {
          session.user.id = numericId;
        } else {

          session.user.id = null;
        }
      }
      if (token.role && session.user) {
        session.user.role = token.role as user_role;
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled;
        session.user.currency = token.currency;
        session.user.name = token.name;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.balance = token.balance;
        session.user.image = token.image;

        session.user.isImpersonating = token.isImpersonating || false;
        session.user.originalAdminId = token.originalAdminId || null;
        (session.user as any).originalAdminRole = token.originalAdminRole || null;
        
        if (!token.isImpersonating) {
          (session.user as any).originalAdminRole = null;
        }
        
        if (token.permissions) {
          (session.user as any).permissions = token.permissions;
        }
      }
      return session;
    },
    async jwt({ token, req, trigger }: any) {
      if (!token.sub) return token;

      let impersonatedUserId: string | null = null;
      let originalAdminId: string | null = null;

      try {
        if (req?.cookies) {
          if (typeof req.cookies.get === 'function') {
            impersonatedUserId = req.cookies.get('impersonated-user-id')?.value || null;
            originalAdminId = req.cookies.get('original-admin-id')?.value || null;
          } else {
            impersonatedUserId = req.cookies['impersonated-user-id'] || null;
            originalAdminId = req.cookies['original-admin-id'] || null;
          }
        }
        
        if ((!impersonatedUserId || !originalAdminId) && req?.headers?.cookie) {
          const cookieHeader = req.headers.cookie;
          if (cookieHeader.includes('impersonated-user-id') || cookieHeader.includes('original-admin-id')) {
            const cookieMap = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
              const [key, value] = cookie.trim().split('=');
              if (key && value) {
                acc[key.trim()] = decodeURIComponent(value.trim());
              }
              return acc;
            }, {});
            if (!impersonatedUserId) impersonatedUserId = cookieMap['impersonated-user-id'] || null;
            if (!originalAdminId) originalAdminId = cookieMap['original-admin-id'] || null;
          }
        }
        
        if ((!impersonatedUserId || !originalAdminId)) {
          try {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            if (!impersonatedUserId) {
              const cookie = cookieStore.get('impersonated-user-id');
              impersonatedUserId = cookie?.value || null;
            }
            if (!originalAdminId) {
              const cookie = cookieStore.get('original-admin-id');
              originalAdminId = cookie?.value || null;
            }
          } catch (e) {
          }
        }
      } catch (error) {
      }

      if (impersonatedUserId && originalAdminId) {
        console.log('JWT Callback - Impersonation detected, fetching users:', { 
          impersonatedUserId, 
          originalAdminId 
        });
        const impersonatedUser = await getUserById(parseInt(impersonatedUserId));
        const originalAdmin = await getUserById(parseInt(originalAdminId));
        if (impersonatedUser && originalAdmin) {
          console.log('JWT Callback - Setting impersonated user token:', { 
            role: impersonatedUser.role, 
            id: impersonatedUser.id 
          });
          token.sub = impersonatedUser.id.toString();
          token.role = impersonatedUser.role;
          token.isTwoFactorEnabled = impersonatedUser.isTwoFactorEnabled;
          token.currency = impersonatedUser.currency;
          token.name = impersonatedUser.name;
          token.username = impersonatedUser.username;
          token.email = impersonatedUser.email;
          token.balance = impersonatedUser.balance;
          token.image = impersonatedUser.image;
          token.isImpersonating = true;
          token.originalAdminId = parseInt(originalAdminId);
          token.originalAdminRole = originalAdmin.role;
          return token;
        } else {
          console.log('JWT Callback - Users not found:', { 
            impersonatedUser: !!impersonatedUser, 
            originalAdmin: !!originalAdmin 
          });
        }
      }

      if (!impersonatedUserId && !originalAdminId && token.originalAdminId) {
        console.log('JWT Callback - Cookies cleared, restoring original admin session:', {
          originalAdminId: token.originalAdminId,
          originalAdminRole: token.originalAdminRole
        });
        
        const originalAdmin = await getUserById(token.originalAdminId);
        if (originalAdmin) {
          console.log('JWT Callback - Restoring admin token:', {
            role: originalAdmin.role,
            id: originalAdmin.id
          });
          token.sub = originalAdmin.id.toString();
          token.role = originalAdmin.role;
          token.isTwoFactorEnabled = originalAdmin.isTwoFactorEnabled;
          token.currency = originalAdmin.currency;
          token.name = originalAdmin.name;
          token.username = originalAdmin.username;
          token.email = originalAdmin.email;
          token.balance = originalAdmin.balance;
          token.image = originalAdmin.image;
          token.isImpersonating = false;
          if (originalAdmin.permissions) {
            token.permissions = Array.isArray(originalAdmin.permissions) 
              ? originalAdmin.permissions 
              : (typeof originalAdmin.permissions === 'string' ? JSON.parse(originalAdmin.permissions) : []);
          } else {
            token.permissions = null;
          }
          token.originalAdminId = null;
          token.originalAdminRole = null;
          return token;
        }
      }

      if (!impersonatedUserId && !originalAdminId) {
        token.isImpersonating = false;
        token.originalAdminId = null;
        token.originalAdminRole = null;
      }

      const numericId = parseInt(token.sub);
      if (!isNaN(numericId)) {
        token.sub = numericId;
        const existingUser = await getUserById(numericId);
        if (!existingUser) return token;
        token.role = existingUser.role;
        token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
        token.currency = existingUser.currency;
        token.name = existingUser.name;
        token.username = existingUser.username;
        token.email = existingUser.email;
        token.balance = existingUser.balance;
        token.image = existingUser.image;
        if (existingUser.permissions) {
          token.permissions = Array.isArray(existingUser.permissions) 
            ? existingUser.permissions 
            : (typeof existingUser.permissions === 'string' ? JSON.parse(existingUser.permissions) : []);
        } else {
          token.permissions = null;
        }
      } else {
        if (token.email) {
          let existingUser = await getUserByEmail(token.email);
          if (!existingUser) {
            const created = await db.users.create({
              data: {
                email: token.email,
                name: token.name || token.email.split('@')[0],
                image: token.picture || null,
                username: token.email.split('@')[0],
                role: 'user',
                status: 'active',
              },
            });
            existingUser = created as any;

            processAffiliateReferral(created.id).catch(err => {
              console.error('Error processing affiliate referral in jwt callback:', err)
            })
          }
          if (existingUser) {
            token.sub = existingUser.id;
            token.role = existingUser.role;
            token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
            token.currency = existingUser.currency;
            token.name = existingUser.name;
            token.username = existingUser.username;
            token.email = existingUser.email;
            token.balance = existingUser.balance;
            token.image = existingUser.image;
            if (existingUser.permissions) {
              token.permissions = Array.isArray(existingUser.permissions) 
                ? existingUser.permissions 
                : (typeof existingUser.permissions === 'string' ? JSON.parse(existingUser.permissions) : []);
            } else {
              token.permissions = null;
            }
            if (existingUser.permissions) {
              token.permissions = Array.isArray(existingUser.permissions) 
                ? existingUser.permissions 
                : (typeof existingUser.permissions === 'string' ? JSON.parse(existingUser.permissions) : []);
            } else {
              token.permissions = null;
            }
          }
        }
      }
      
      return token;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-error",
  },
  trustHost: true,
} satisfies NextAuthConfig;
