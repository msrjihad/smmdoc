import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { getVerificationTokenByEmail } from "@/data/verification-token";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";

export const generateTwoFactorToken = async (email: string) => {
  const token = crypto.randomInt(100_000, 1000_000).toString();
  const expires = new Date(new Date().getTime() + 1000 * 60 * 5);
  const existingToken = await getTwoFactorTokenByEmail(email);
  if (existingToken) {
    await db.twoFactorTokens.delete({
      where: {
        id: existingToken.id,
      },
    });
  }
  const twoFactorToken = await db.twoFactorTokens.create({
    data: {
      token,
      email,
      expires,
    },
  });
  return twoFactorToken;
};

export const generatePasswordResetToken = async (email: string) => {

  const userSettings = await db.userSettings.findFirst();
  const resetLinkMax = userSettings?.resetLinkMax || 3;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayResetCount = await db.passwordResetTokens.count({
    where: {
      email,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (todayResetCount >= resetLinkMax) {
    throw new Error(`You have reached the maximum number of password reset attempts (${resetLinkMax}) for today. Please try again tomorrow.`);
  }

  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 1000 * 60 * 60 * 24);

  const passwordResetToken = await db.passwordResetTokens.create({
    data: {
      token,
      email,
      expires,
    },
  });
  return passwordResetToken;
};

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 1000 * 60 * 60 * 24);
  const existingToken = await getVerificationTokenByEmail(email);
  if (existingToken) {
    await db.verificationTokens.delete({
      where: {
        id: existingToken.id,
      },
    });
  }
  const verificationToken = await db.verificationTokens.create({
    data: {
      token,
      email,
      expires,
    },
  });
  return verificationToken;
};

export const generateVerificationCode = async (email: string) => {
  const code = crypto.randomInt(100_000, 1000_000).toString();
  const expires = new Date(new Date().getTime() + 1000 * 60 * 15);
  const existingToken = await getVerificationTokenByEmail(email);
  if (existingToken) {
    await db.verificationTokens.delete({
      where: {
        id: existingToken.id,
      },
    });
  }
  const verificationToken = await db.verificationTokens.create({
    data: {
      token: code,
      email,
      expires,
    },
  });
  return verificationToken;
};