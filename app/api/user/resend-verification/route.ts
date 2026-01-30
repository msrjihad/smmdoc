import { auth } from '@/auth';
import { ActivityLogger } from '@/lib/activity-logger';
import { db } from '@/lib/db';
import { sendVerificationCodeEmail } from '@/lib/nodemailer';
import { generateVerificationCode } from '@/lib/tokens';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { NextResponse } from 'next/server';

export async function POST() {
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

    const user = await db.users.findUnique({
      where: { id: session.user.id },
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

    if (!user.email) {
      return NextResponse.json(
        {
          error: 'No email address found for this user',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email is already verified',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const verificationToken = await generateVerificationCode(user.email);

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
          ...templateContextFromUser(user),
          otp: verificationToken.token,
        }
      );
      const emailSent = emailData
        ? await sendVerificationCodeEmail(
            user.email,
            verificationToken.token,
            user.name || user.username || undefined,
            emailData
          )
        : await sendVerificationCodeEmail(
            user.email,
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
        session.user.id,
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
          email: user.email
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
