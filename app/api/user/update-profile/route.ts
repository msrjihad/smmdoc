import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogger } from '@/lib/activity-logger';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { sendMail, sendVerificationCodeEmail } from '@/lib/nodemailer';
import { generateVerificationCode } from '@/lib/tokens';
import { getVerificationTokenByToken } from '@/data/verification-token';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Please login.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const userId = parseInt(String(session.user.id), 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user session', success: false, data: null },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fullName, email, username, verificationCode } = body;

    const existingUser = await db.users.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    if (username !== undefined && username !== existingUser.username) {
      const usernameExists = await db.users.findFirst({
        where: {
          username: username,
          id: { not: userId }
        }
      });

      if (usernameExists) {
        return NextResponse.json(
          {
            error: 'Username already exists. Please choose a different username.',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }

    const isEmailChanging = email !== undefined && email !== existingUser.email;

    // If verification code provided (for email change or current email verification)
    const code = typeof verificationCode === 'string' ? verificationCode.trim() : '';
    if (code) {
      const verificationToken = await getVerificationTokenByToken(code);
      if (!verificationToken) {
        return NextResponse.json(
          { error: 'Invalid verification code', success: false, data: null },
          { status: 400 }
        );
      }
      const hasExpired = new Date(verificationToken.expires) < new Date();
      if (hasExpired) {
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new one.', success: false, data: null },
          { status: 400 }
        );
      }
      const targetEmail = isEmailChanging ? email : existingUser.email;
      if (!targetEmail || verificationToken.email !== targetEmail) {
        return NextResponse.json(
          { error: 'Verification code does not match your email address', success: false, data: null },
          { status: 400 }
        );
      }
    }

    if (isEmailChanging) {
      const emailExists = await db.users.findFirst({
        where: {
          email: email,
          id: { not: userId }
        }
      });

      if (emailExists) {
        return NextResponse.json(
          {
            error: 'Email already exists. Please choose a different email address.',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    
    if (fullName !== undefined) updateData.name = fullName;
    if (email !== undefined) {
      updateData.email = email;
      // If code was provided and validated, mark as verified; otherwise unverified
      updateData.emailVerified = code ? new Date() : null;
    } else if (code && existingUser.email) {
      // Verification code for current email (no email change)
      updateData.emailVerified = new Date();
    }
    if (username !== undefined) updateData.username = username;

    const updatedUser = await db.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        emailVerified: true,
        updatedAt: true,
      }
    });

    // Delete verification token if code was used
    if (code) {
      const verificationToken = await getVerificationTokenByToken(code);
      if (verificationToken) {
        await db.verificationTokens.delete({ where: { id: verificationToken.id } }).catch(() => {});
      }
    }

    try {
      const username = session.user.username || session.user.email?.split('@')[0] || `user${userId}`;
      await ActivityLogger.profileUpdated(
        userId,
        username,
        Object.keys(updateData).join(', ')
      );
    } catch (error) {
      console.error('Failed to log profile update activity:', error);
    }

    // If email changed WITHOUT code, send verification code to new email (account now unverified)
    if (isEmailChanging && !code) {
      try {
        const verificationToken = await generateVerificationCode(email);
        if (verificationToken) {
          const emailData = await resolveEmailContent(
            'account_user_account_verification',
            {
              ...templateContextFromUser({ ...existingUser, email }),
              otp: verificationToken.token,
            }
          );
          const emailSent = emailData
            ? await sendVerificationCodeEmail(
                email,
                verificationToken.token,
                existingUser.name || existingUser.username || undefined,
                emailData
              )
            : await sendVerificationCodeEmail(
                email,
                verificationToken.token,
                existingUser.name || existingUser.username || undefined
              );
          if (!emailSent) {
            console.error('Failed to send verification email to new email');
          }
        }
      } catch (emailError) {
        console.error('Failed to send verification email after email change:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
      error: null
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
