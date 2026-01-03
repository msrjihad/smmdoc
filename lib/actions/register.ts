"use server";
import bcrypt from "bcryptjs";
import * as z from "zod";

import { getUserByEmail } from "@/data/user";
import { db } from "../db";
import { sendVerificationCodeEmail } from "../nodemailer";
import { generateVerificationCode } from "../tokens";
import { signUpSchema, createSignUpSchema } from "../validators/auth.validator";
import { verifyReCAPTCHA, getReCAPTCHASettings } from "../recaptcha";
import { processAffiliateReferral } from "../affiliate-referral-helper";

export const register = async (values: any & { recaptchaToken?: string }) => {
  console.log('Received values:', values);

  if (!values.confirmPassword && values.password) {
    values = { ...values, confirmPassword: values.password };
    console.log('Added confirmPassword:', values);
  }

  const recaptchaSettings = await getReCAPTCHASettings();
  if (recaptchaSettings && recaptchaSettings.enabledForms?.signUp) {
    if (!values.recaptchaToken) {
      return { success: false, error: "reCAPTCHA verification is required" };
    }

    const recaptchaResult = await verifyReCAPTCHA(
      values.recaptchaToken,
      recaptchaSettings.secretKey!,
      recaptchaSettings.version === 'v3' ? 'signup' : undefined,
      recaptchaSettings.version === 'v3' ? recaptchaSettings.threshold : undefined
    );

    if (!recaptchaResult.success) {
      return { success: false, error: recaptchaResult.error || "reCAPTCHA verification failed" };
    }
  }

  const userSettings = await db.userSettings.findFirst();
  const nameFieldEnabled = userSettings?.nameFieldEnabled ?? true;
  
  const dynamicSchema = createSignUpSchema(nameFieldEnabled);
  const validatedFields = dynamicSchema.safeParse(values);
  console.log('Validation result:', validatedFields);

  if (!validatedFields.success) {
    console.log('Validation errors:', validatedFields.error.format());
    return { success: false, error: "Invalid fields" };
  }
  const { username, name, email, password, confirmPassword } = validatedFields.data;

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { success: false, error: "Email already exists" };
  }

  const existingUsername = await db.users.findUnique({
    where: { username: username }
  });
  if (existingUsername) {
    return { success: false, error: "Username is already exist" };
  }
  try {
    let initialBalance = 0;

    if (userSettings && userSettings.freeAmount > 0) {
      initialBalance = userSettings.freeAmount;
    }

    const emailConfirmationEnabled = userSettings?.emailConfirmationEnabled ?? true;

    const userName = nameFieldEnabled ? name : (name || null);

    const timezone = values.timezone || 'Asia/Dhaka';

    const newUser = await db.users.create({
      data: {
        username,
        name: userName,
        email,
        password: hashedPassword,
        balance: initialBalance,
        total_deposit: initialBalance,
        emailVerified: emailConfirmationEnabled ? null : new Date(),
        timezone: timezone,
      },
    });

    await processAffiliateReferral(newUser.id);

    if (emailConfirmationEnabled) {
      const verificationToken = await generateVerificationCode(email);
      if (verificationToken) {
        const emailSent = await sendVerificationCodeEmail(
          email,
          verificationToken.token,
          userName || username
        );

        if (!emailSent) {
          return { success: false, error: "Failed to send verification code email. Please try again." };
        }
      }
    }

    let successMessage = "Registration successful!";

    if (initialBalance > 0) {
      successMessage += ` You have received $${initialBalance} as welcome bonus.`;
    }

    if (emailConfirmationEnabled) {
      successMessage += " Please check your email for verification code. You must verify your email before logging in.";
    } else {
      successMessage += " You can now log in to your account.";
    }

    return { 
      success: true, 
      error: "", 
      message: successMessage,
      email: emailConfirmationEnabled ? email : undefined,
      shouldAutoLogin: !emailConfirmationEnabled,
      userEmail: email
    };
  } catch (error) {
    console.error('Database error during user creation:', error);
    return { success: false, error: "Failed to create user account. Please try again." };
  }
};
