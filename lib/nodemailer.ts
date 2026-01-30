import nodemailer, { Transporter } from "nodemailer";
import { createEmailTransporter, getFromEmailAddress } from './email-config';
import { getAppName } from './utils/general-settings';
import crypto from 'crypto';

interface MailOptions {
  sendTo: string;
  subject: string;
  html: string;
  fromName?: string | null;
}

export const sendMail = async ({
  sendTo,
  subject,
  html,
  fromName: fromNameOverride,
}: MailOptions): Promise<boolean> => {
  try {

    const transporter = await createEmailTransporter();

    if (!transporter) {
      console.error("❌ Email transporter not available. Please configure email settings in admin panel.");
      return false;
    }

    const fromEmail = await getFromEmailAddress();

    if (!fromEmail) {
      console.error("❌ From email address not configured. Please configure email settings in admin panel.");
      return false;
    }

    const appName = await getAppName();
    const displayName = (fromNameOverride != null && fromNameOverride !== '') ? fromNameOverride : appName;

    const randomBytes = crypto.randomBytes(8).toString('hex');
    const messageId = `<${Date.now()}.${randomBytes}@${fromEmail.split('@')[1]}>`;

    await transporter.sendMail({
      from: `"${displayName}" <${fromEmail}>`,
      to: sendTo,
      subject: subject,
      html: html,
      replyTo: fromEmail,
      messageId: messageId,
      headers: {
        'X-Mailer': `${appName} Mail System`,
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'List-Unsubscribe': `<mailto:${fromEmail}?subject=Unsubscribe>`,
        'Return-Path': fromEmail,
      },
    });

    console.log(`✅ Email sent successfully to: ${sendTo}`);
    return true;
  } catch (error) {

    const emailError = error as any;

    console.error("❌ Error in sending mail:", {
      code: emailError.code || 'UNKNOWN',
      message: emailError.message || 'Unknown error occurred',
      to: sendTo,
      subject: subject
    });

    if (emailError.code === 'EAUTH') {
      console.error("🔐 Authentication failed. Please check:");
      console.error("- SMTP username is correct in admin email settings");
      console.error("- SMTP password is valid in admin email settings");
      console.error("- SMTP settings are correct for your email provider");
    }

    return false;
  }
};

export const sendVerificationEmail = async (
  email: string,
  token: string,
  userName?: string
): Promise<boolean> => {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  const name = userName || 'User';
  const appName = await getAppName();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification - ${appName}</h2>
      <p>Hello ${name},</p>
      <p>Please click the button below to verify your email address:</p>
      <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Email
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>${appName} Team</p>
    </div>
  `;

  return await sendMail({
    sendTo: email,
    subject: `Verify Your Email - ${appName}`,
    html: html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  userName?: string
): Promise<boolean> => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  const name = userName || 'User';
  const appName = await getAppName();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset - ${appName}</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>${appName} Team</p>
    </div>
  `;

  return await sendMail({
    sendTo: email,
    subject: `Password Reset - ${appName}`,
    html: html,
  });
};

export const sendVerificationCodeEmail = async (
  email: string,
  code: string,
  userName?: string,
  customEmail?: { subject: string; fromName: string | null; html: string }
): Promise<boolean> => {
  if (customEmail) {
    return await sendMail({
      sendTo: email,
      subject: customEmail.subject,
      html: customEmail.html,
      fromName: customEmail.fromName,
    });
  }

  const name = userName || 'User';
  const appName = await getAppName();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification Code - ${appName}</h2>
      <p>Hello ${name},</p>
      <p>Please use the verification code below to verify your email address:</p>
      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Your Verification Code</h3>
        <div style="background-color: #ffffff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; display: inline-block; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0;">This code expires in 15 minutes</p>
      </div>
      <p>Enter this code on the verification page to complete your email verification and log in.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>${appName} Team</p>
    </div>
  `;

  return await sendMail({
    sendTo: email,
    subject: `Email Verification Code - ${appName}`,
    html: html,
  });
};