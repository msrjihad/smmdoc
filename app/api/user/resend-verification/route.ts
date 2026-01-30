import { auth } from '@/auth';
import { ActivityLogger } from '@/lib/activity-logger';
import { db } from '@/lib/db';
import { sendVerificationCodeEmail } from '@/lib/nodemailer';
import { generateVerificationCode } from '@/lib/tokens';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { NextRequest, NextResponse } from 'next/server';

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

    let body: { email?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - use user's current email
    }

    const targetEmail = body.email?.trim();

    const user = await db.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        emailVerified: true
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    // Determine which email to send code to
    const emailToUse = targetEmail || user.email;

    if (!emailToUse) {
      return NextResponse.json(
        {
          error: 'No email address found for this user',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    // If sending to a NEW email (for change flow), validate it's not taken
    if (targetEmail && targetEmail.toLowerCase() !== (user.email || '').toLowerCase()) {
      const emailExists = await db.users.findFirst({
        where: {
          email: targetEmail,
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
    } else if (!targetEmail && user.emailVerified) {
      // Sending to current email and already verified
      return NextResponse.json(
        {
          error: 'Email is already verified',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const verificationToken = await generateVerificationCode(emailToUse);

    if (!verificationToken) {
      return NextResponse.json(
        {
          error: 'Failed to generate verification code',
          success: false,
          data: null
        },
        { status: 500 }
      );
    }

    try {
      const emailData = await resolveEmailContent(
        'account_user_account_verification',
        {
          ...templateContextFromUser({ ...user, email: emailToUse }),
          otp: verificationToken.token,
        }
      );
      const emailSent = emailData
        ? await sendVerificationCodeEmail(
            emailToUse,
            verificationToken.token,
            user.name || user.username || undefined,
            emailData
          )
        : await sendVerificationCodeEmail(
            emailToUse,
            verificationToken.token,
            user.name || user.username || undefined
          );
      if (!emailSent) {
        throw new Error('Failed to send verification email');
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        {
          error: 'Failed to send verification email',
          success: false,
          data: null
        },
        { status: 500 }
      );
    }

    try {
      const username = user.username || user.email?.split('@')[0] || `user${user.id}`;
      await ActivityLogger.profileUpdated(
        userId,
        username,
        'verification_email_resent'
      );
    } catch (error) {
      console.error('Failed to log verification email activity:', error);
    }

    return NextResponse.json(
      {
        success: true,
        data: { 
          message: 'Verification email sent successfully',
          email: emailToUse
        },
        error: null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend verification email error:', error);
    return NextResponse.json(
      {
        error: 'Failed to resend verification email',
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
