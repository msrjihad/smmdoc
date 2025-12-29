import { db } from "@/lib/db";

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await db.passwordResetTokens.findUnique({
      where: { token },
    });
    return passwordResetToken;
  } catch {
    return null;
  }
};

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const passwordResetToken = await db.passwordResetTokens.findFirst({
      where: { email },
    });
    return passwordResetToken;
  } catch {
    return null;
  }
};
