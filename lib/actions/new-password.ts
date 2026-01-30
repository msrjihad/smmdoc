"use server";

import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { db } from "../db";
import { newPasswordSchema } from "../validators/auth.validator";
import { resolveEmailContent } from "@/lib/email-templates/resolve-email-content";
import { templateContextFromUser } from "@/lib/email-templates/replace-template-variables";
import { sendMail } from "@/lib/nodemailer";

export const newPasswordValues = async (
  values: z.infer<typeof newPasswordSchema>,
  token?: string | null
) => {

  const userSettings = await db.userSettings.findFirst();
  const resetPasswordEnabled = userSettings?.resetPasswordEnabled ?? true;

  if (!resetPasswordEnabled) {
    return { success: false, error: "Password reset is currently disabled. Please contact support." };
  }

  if (!token) {
    return { success: false, error: "Missing token" };
  }
  const validtedValues = newPasswordSchema.safeParse(values);
  if (!validtedValues.success) {
    return { success: false, error: "Invalid field" };
  }
  const { password } = validtedValues.data;
  const existingToken = await getPasswordResetTokenByToken(token);
  if (!existingToken) {
    return { success: false, error: "Invalid token" };
  }
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { success: false, error: "Token has expired" };
  }
  const existingUser = await getUserByEmail(existingToken.email);
  if (!existingUser) {
    return { success: false, error: "User does not exist" };
  }
  const isSameAsOld = existingUser.password && await bcrypt.compare(password, existingUser.password);
  if (isSameAsOld) {
    return { success: false, error: "New password must be different from your current password." };
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.users.update({
    where: { email: existingToken.email },
    data: { password: hashedPassword },
  });
  await db.passwordResetTokens.delete({ where: { token } });

  try {
    const emailData = await resolveEmailContent(
      'account_user_password_changed',
      templateContextFromUser(existingUser)
    );
    if (emailData && existingUser.email) {
      await sendMail({
        sendTo: existingUser.email,
        subject: emailData.subject,
        html: emailData.html,
        fromName: emailData.fromName ?? undefined,
      });
    }
  } catch (emailError) {
    console.error('Failed to send Password Changed email:', emailError);
  }

  return { success: true, error: "", message: "Password updated successfully" };
};
