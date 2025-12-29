"use server";

import { getUserByEmail } from "@/data/user";
import * as z from "zod";
import { db } from "../db";
import { sendMail } from "../nodemailer";
import { generatePasswordResetToken } from "../tokens";
import { resetSchema } from "../validators/auth.validator";

export const resetPassword = async (values: z.infer<typeof resetSchema>) => {
  const userSettings = await db.userSettings.findFirst();
  const resetPasswordEnabled = userSettings?.resetPasswordEnabled ?? true;

  if (!resetPasswordEnabled) {
    return { success: false, error: "Password reset is currently disabled. Please contact support." };
  }

  const validatedFields = resetSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, error: "Invalid field" };
  }
  const { email } = validatedFields.data;
  const existingUser = await getUserByEmail(email);
  if (!existingUser) {
    return { success: false, error: "Email does not exist!" };
  }

  try {
    const resetPasswordToken = await generatePasswordResetToken(email);
    await sendMail({
      sendTo: email,
      subject: "Reset Password",
      html: `<a href="${process.env.NEXT_PUBLIC_APP_URL}/new-password?token=${resetPasswordToken.token}">Click here to reset your password</a>`,
    });
    return {
    success: true,
    error: "",
    message: "Reset password link email sent",
  };
  } catch (error) {
    if (error instanceof Error && error.message.includes('maximum number of password reset attempts')) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to send reset email. Please try again." };
  }
};
