"use server";

import { headers } from 'next/headers';
import { auth, signIn } from '@/auth';
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { db } from "../db";
import { generateVerificationCode } from "../tokens";
import { sendVerificationCodeEmail } from "../nodemailer";
import { ActivityLogger } from "../activity-logger";
import { DEFAULT_SIGN_IN_REDIRECT } from "../routes";

export const verificationConfirm = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return { success: false, error: "Invalid token" };
  }
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { success: false, error: "Token has expired" };
  }
  const existingUser = await getUserByEmail(existingToken.email);
  if (!existingUser) {
    return { success: false, error: "User not found" };
  }
  await db.users.update({
    where: { id: existingUser.id },
    data: { emailVerified: new Date(), email: existingToken.email },
  });
  await db.verificationTokens.delete({ where: { id: existingToken.id } });
  return { success: true, error: "", message: "Email verified" };
};

export const sendVerificationCode = async (email: string) => {
  const existingUser = await getUserByEmail(email);
  if (!existingUser) {
    return { success: false, error: "User not found" };
  }

  if (existingUser.emailVerified) {
    return { success: false, error: "Email is already verified" };
  }

  const verificationToken = await generateVerificationCode(email);
  if (!verificationToken) {
    return { success: false, error: "Failed to generate verification code" };
  }

  const emailSent = await sendVerificationCodeEmail(
    email,
    verificationToken.token,
    existingUser.name || existingUser.username || undefined
  );

  if (!emailSent) {
    return { success: false, error: "Failed to send verification code email" };
  }

  return { success: true, error: "", message: "Verification code sent to your email" };
};

export const verifyCodeAndLogin = async (email: string, code: string) => {
  const existingUser = await getUserByEmail(email);
  if (!existingUser || !existingUser.email) {
    return { success: false, error: "User not found" };
  }

  if (!existingUser.password) {
    return { success: false, error: "Invalid user account" };
  }

  const existingToken = await getVerificationTokenByToken(code);
  if (!existingToken) {
    return { success: false, error: "Invalid verification code" };
  }

  if (existingToken.email !== email) {
    return { success: false, error: "Verification code does not match email" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { success: false, error: "Verification code has expired" };
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

  await db.users.update({
    where: { id: existingUser.id },
    data: { emailVerified: new Date(), email: existingToken.email },
  });

  try {
    const isAdmin = existingUser.role === 'admin';
    const redirectUrl = isAdmin ? '/admin' : DEFAULT_SIGN_IN_REDIRECT;

    await signIn('credentials', {
      email: existingUser.email,
      password: `VERIFICATION_TOKEN:${code}`,
      redirect: false
    });

    await db.verificationTokens.delete({ where: { id: existingToken.id } });

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
      error: "",
      message: "Email verified and logged in successfully",
      redirectTo: redirectUrl,
      isAdmin: isAdmin
    };
  } catch (error) {
    console.error('Login error after verification:', error);
    return { success: false, error: "Email verified but failed to log in. Please try signing in." };
  }
};
