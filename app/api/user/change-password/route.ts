import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogger } from '@/lib/activity-logger';
import bcrypt from 'bcryptjs';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { sendMail } from '@/lib/nodemailer';

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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error: 'Current password and new password are required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          error: 'New password must be at least 6 characters long',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const user = await db.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
        username: true,
        name: true
      }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          error: 'User not found or no password set',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          error: 'Current password is incorrect',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await db.users.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    try {
      const username = user.username || user.email?.split('@')[0] || `user${user.id}`;
      await ActivityLogger.passwordChanged(
        userId,
        username
      );
    } catch (error) {
      console.error('Failed to log password change activity:', error);
    }

    try {
      const emailData = await resolveEmailContent(
        'account_user_password_changed',
        templateContextFromUser(user)
      );
      if (emailData && user.email) {
        await sendMail({
          sendTo: user.email,
          subject: emailData.subject,
          html: emailData.html,
          fromName: emailData.fromName ?? undefined,
        });
      }
    } catch (emailError) {
      console.error('Failed to send Password Changed email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        data: { message: 'Password changed successfully' },
        error: null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      {
        error: 'Failed to change password',
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
