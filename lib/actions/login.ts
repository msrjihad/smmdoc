'use server';
import { headers } from 'next/headers';
import * as z from 'zod';

import { auth, signIn } from '@/auth';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { getUserByEmail, getUserByUsername } from '@/data/user';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { ActivityLogger } from '../activity-logger';
import { db } from '../db';
import { sendMail } from '../nodemailer';
import { DEFAULT_SIGN_IN_REDIRECT } from '../routes';
import { generateTwoFactorToken, generateVerificationToken } from '../tokens';
import { signInSchema } from '../validators/auth.validator';
import { verifyReCAPTCHA, getReCAPTCHASettings } from '../recaptcha';

export type LoginResult = {
  success: boolean;
  error?: string;
  message?: string;
  twoFactor?: boolean;
  redirectTo?: string;
  isAdmin?: boolean;
  requiresEmailVerification?: boolean;
  email?: string;
};

export const login = async (
  values: z.infer<typeof signInSchema> & { recaptchaToken?: string }
): Promise<LoginResult> => {

  const recaptchaSettings = await getReCAPTCHASettings();
  if (recaptchaSettings && recaptchaSettings.enabledForms?.signIn) {
    if (!values.recaptchaToken) {
      return { success: false, error: "reCAPTCHA verification is required" };
    }

    const recaptchaResult = await verifyReCAPTCHA(
      values.recaptchaToken,
      recaptchaSettings.secretKey!,
      recaptchaSettings.version === 'v3' ? 'signin' : undefined,
      recaptchaSettings.version === 'v3' ? recaptchaSettings.threshold : undefined
    );

    if (!recaptchaResult.success) {
      return { success: false, error: recaptchaResult.error || "reCAPTCHA verification failed" };
    }
  }

  const { getMaintenanceMode } = await import('@/lib/utils/general-settings');
  const maintenanceMode = await getMaintenanceMode();
  
  const validedFields = signInSchema.safeParse(values);
  if (!validedFields.success) {
    return { success: false, error: 'Invalid Fields!' };
  }
  const { email, password, code } = validedFields.data;

  const isEmail = email.includes('@');

  const existingUser = isEmail
    ? await getUserByEmail(email)
    : await getUserByUsername(email);
  if (!existingUser || !existingUser.password || !existingUser.email) {
    return { success: false, error: 'User does not exist!' };
  }

  if (maintenanceMode === 'active') {
    if (existingUser.role !== 'admin' && existingUser.role !== 'moderator') {
      return { success: false, error: 'Login is restricted during maintenance mode. Only administrators can access the site.' };
    }
  }

  const passwordsMatch = await bcrypt.compare(password, existingUser.password);
  if (!passwordsMatch) {
    return { success: false, error: 'Invalid Credentials!' };
  }

  if (existingUser.status === 'banned') {
    return { success: false, error: "You're banned from our platform! Please contact support." };
  }

  if (existingUser.status === 'suspended') {

    if (existingUser.suspendedUntil && new Date() > existingUser.suspendedUntil) {

      await db.users.update({
        where: { id: existingUser.id },
        data: {
          status: 'active',
          suspendedUntil: null
        }
      });
    } else {

      let suspensionMessage = "You're suspended from our platform!";

      if (existingUser.suspendedUntil) {
        const now = new Date();
        const suspendedUntil = new Date(existingUser.suspendedUntil);
        const diffMs = suspendedUntil.getTime() - now.getTime();

        if (diffMs > 0) {
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          if (diffDays > 0) {
            suspensionMessage += ` Your suspension will be lifted in ${diffDays} day${diffDays > 1 ? 's' : ''} and ${diffHours} hour${diffHours > 1 ? 's' : ''}.`;
          } else if (diffHours > 0) {
            suspensionMessage += ` Your suspension will be lifted in ${diffHours} hour${diffHours > 1 ? 's' : ''} and ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}.`;
          } else {
            suspensionMessage += ` Your suspension will be lifted in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}.`;
          }
        }
      }

      suspensionMessage += " Please contact support if you have any questions.";
      return { success: false, error: suspensionMessage };
    }
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email
    );

    await sendMail({
      sendTo: existingUser.email,
      subject: 'Email Verification',
      html: `<a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken?.token}">Click here to verify your email</a>`,
    });
    return { 
      success: true, 
      message: 'Confirmation email sent!', 
      requiresEmailVerification: true,
      email: existingUser.email 
    };
  }










































  try {

    const isAdmin = existingUser.role === 'admin';

    const redirectUrl = isAdmin ? '/admin' : DEFAULT_SIGN_IN_REDIRECT;

    console.log('User role:', existingUser.role);
    console.log('Is admin:', isAdmin);
    console.log('Redirect URL:', redirectUrl);

    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    console.log('SignIn result:', JSON.stringify(signInResult, null, 2));

    const session = await auth();
    console.log('Session after sign-in:', JSON.stringify({
      id: session?.user?.id,
      name: session?.user?.name,
      email: session?.user?.email,
      role: session?.user?.role
    }, null, 2));

    try {
      const headersList = await headers();
      const clientIP = headersList.get('x-client-ip') ||
                      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      headersList.get('x-real-ip') ||
                      'unknown';

      const username = existingUser.username || existingUser.email?.split('@')[0] || `user${existingUser.id}`;

      if (isAdmin) {
        await ActivityLogger.adminLogin(existingUser.id, username, clientIP);
      } else {
        await ActivityLogger.login(existingUser.id, username, clientIP);
      }
    } catch (logError) {
      console.error('Failed to log login activity:', logError);

    }

    return {
      success: true,
      message: 'Logged in successfully!',
      redirectTo: redirectUrl,
      isAdmin: isAdmin
    };
  } catch (error) {
    console.error('Login error details:', error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid Credentials!' };
        case 'CallbackRouteError':
          return { success: false, error: 'Authentication callback error. Please try again.' };
        case 'AccessDenied':
          return { success: false, error: 'Access denied. Please verify your email or contact support.' };
        default:
          console.error('Unknown AuthError type:', error.type);
          return { success: false, error: `Authentication error: ${error.type}` };
      }
    }
    console.error('Non-AuthError during login:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
};

export const toggleTwoFactor = async (toggle: boolean) => {
  const session = await auth();
  if (!session?.user.id) {
    return { success: false, error: 'User not found!' };
  }
  const user = await getUserByEmail(session.user.email as string);
  if (!user) {
    return { success: false, error: 'User not found!' };
  }

  await db.users.update({
    where: { id: user.id },
    data: {
      isTwoFactorEnabled: toggle,
    },
  });










  return { success: true, message: 'Two factor authentication updated!' };
};

export const adminLogin = async (values: z.infer<typeof signInSchema>) => {
  const validedFields = signInSchema.safeParse(values);
  if (!validedFields.success) {
    return { success: false, error: 'Invalid Fields!' };
  }

  const { email, password } = validedFields.data;
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.password || !existingUser.email) {
    return { success: false, error: 'User does not exist!' };
  }

  if (existingUser.role !== 'admin') {
    return { success: false, error: 'Access denied. Admin login only.' };
  }

  const passwordsMatch = await bcrypt.compare(password, existingUser.password);
  if (!passwordsMatch) {
    return { success: false, error: 'Invalid Credentials!' };
  }

  if (existingUser.status === 'banned') {
    return { success: false, error: "You're banned from our platform! Please contact support." };
  }

  if (existingUser.status === 'suspended') {

    if (existingUser.suspendedUntil && new Date() > existingUser.suspendedUntil) {

      await db.users.update({
        where: { id: existingUser.id },
        data: {
          status: 'active',
          suspendedUntil: null
        }
      });
    } else {

      let suspensionMessage = "You're suspended from our platform!";

      if (existingUser.suspendedUntil) {
        const now = new Date();
        const suspendedUntil = new Date(existingUser.suspendedUntil);
        const diffMs = suspendedUntil.getTime() - now.getTime();

        if (diffMs > 0) {
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          if (diffDays > 0) {
            suspensionMessage += ` Your suspension will be lifted in ${diffDays} day${diffDays > 1 ? 's' : ''} and ${diffHours} hour${diffHours > 1 ? 's' : ''}.`;
          } else if (diffHours > 0) {
            suspensionMessage += ` Your suspension will be lifted in ${diffHours} hour${diffHours > 1 ? 's' : ''} and ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}.`;
          } else {
            suspensionMessage += ` Your suspension will be lifted in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}.`;
          }
        }
      }

      suspensionMessage += " Please contact support if you have any questions.";
      return { success: false, error: suspensionMessage };
    }
  }

  try {
    console.log('Admin login attempt for user:', email);

    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    console.log('Admin login result:', JSON.stringify(signInResult, null, 2));

    const session = await auth();
    console.log('Admin session after sign-in:', JSON.stringify({
      id: session?.user?.id,
      name: session?.user?.name,
      email: session?.user?.email,
      role: session?.user?.role
    }, null, 2));

    try {
      const headersList = await headers();
      const clientIP = headersList.get('x-client-ip') ||
                      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      headersList.get('x-real-ip') ||
                      'unknown';

      const username = existingUser.username || existingUser.email?.split('@')[0] || `user${existingUser.id}`;
      await ActivityLogger.adminLogin(existingUser.id, username, clientIP);
    } catch (logError) {
      console.error('Failed to log admin login activity:', logError);

    }

    return { 
      success: true, 
      message: 'Admin logged in successfully!', 
      redirectTo: '/admin',
      isAdmin: true
    };
  } catch (error) {
    console.error('Admin login error details:', error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid Admin Credentials!' };
        default:
          console.error('Unknown AuthError type:', error.type);
          return { success: false, error: `Authentication error: ${error.type}` };
      }
    }
    console.error('Non-AuthError during admin login:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
};
