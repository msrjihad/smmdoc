import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createEmailTransporter, getFromEmailAddress, invalidateEmailConfigCache } from '@/lib/email-config';
import { getAppName } from '@/lib/utils/general-settings';
import { getEmailLayoutDataFromSettings } from '@/lib/email-templates/get-email-layout-data';
import { createEmailTemplate } from '@/lib/email-templates/shared/email-layout';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields (to, subject, message) are required' },
        { status: 400 }
      );
    }

    invalidateEmailConfigCache();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }
    
    const transporter = await createEmailTransporter();
    
    if (!transporter) {
      return NextResponse.json(
        { error: 'SMTP settings not configured. Please configure SMTP settings first.' },
        { status: 400 }
      );
    }

    try {
      const fromEmail = await getFromEmailAddress();
      const appName = await getAppName();

      if (!fromEmail) {
        return NextResponse.json(
          { error: 'Support email address not configured. Please configure email settings first.' },
          { status: 400 }
        );
      }

      const layoutData = await getEmailLayoutDataFromSettings();
      const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
      const bodyContent = `<p style="color: #374151; line-height: 1.6; margin: 0;">${safeMessage}</p>`;
      const html = createEmailTemplate(
        { ...layoutData, title: subject || 'Test Email' },
        bodyContent
      );

      await transporter.sendMail({
        from: `"${appName} Test" <${fromEmail}>`,
        to: to,
        subject: subject,
        html,
      });

      console.log(`✅ Test email sent successfully to ${to}`);
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
        data: {
          recipient: to,
          subject: subject,
          sentAt: new Date().toISOString()
        }
      });
    } catch (emailError: any) {
      console.error('❌ Error sending test email:', {
        code: emailError.code || 'UNKNOWN',
        message: emailError.message || 'Unknown error occurred',
        to: to,
        subject: subject
      });
      
      let errorMessage = 'Failed to send test email. Please check your SMTP settings.';
      
      if (emailError.code === 'EAUTH') {
        errorMessage = 'SMTP Authentication failed. Please check your username and password.';
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage = 'Cannot connect to SMTP server. Please check your host and port settings.';
      } else if (emailError.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timeout. Please check your SMTP server settings.';
      } else if (emailError.message) {
        errorMessage = `SMTP Error: ${emailError.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: String(error) },
      { status: 500 }
    );
  }
}
