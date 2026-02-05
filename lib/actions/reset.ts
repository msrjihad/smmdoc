"use server";

import { getUserByEmail } from "@/data/user";
import * as z from "zod";
import { db } from "../db";
import { sendMail } from "../nodemailer";
import { generatePasswordResetOTP } from "../tokens";
import { resetSchema } from "../validators/auth.validator";
import { resolveEmailContent } from "@/lib/email-templates/resolve-email-content";
import { templateContextFromUser } from "@/lib/email-templates/replace-template-variables";

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
    const resetPasswordToken = await generatePasswordResetOTP(email);
    const emailData = await resolveEmailContent(
      'account_user_account_verification',
      {
        ...templateContextFromUser(existingUser),
        otp: resetPasswordToken.token,
      }
    );
    if (emailData) {
      await sendMail({
        sendTo: email,
        subject: emailData.subject,
        html: emailData.html,
        fromName: emailData.fromName ?? undefined,
      });
    } else {
      await sendMail({
        sendTo: email,
        subject: "Reset Password - Verification Code",
        html: `Your password reset code is: <strong>${resetPasswordToken.token}</strong>. Visit ${process.env.NEXT_PUBLIC_APP_URL}/new-password?token=${resetPasswordToken.token} to reset your password.`,
      });
    }
    return {
      success: true,
      error: "",
      message: "Reset password OTP sent to your email",
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('maximum number of password reset attempts')) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to send reset email. Please try again." };
  }
};
