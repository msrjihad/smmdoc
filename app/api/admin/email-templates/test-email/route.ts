import { auth } from '@/auth';
import { sendMail } from '@/lib/nodemailer';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { getPredefinedTemplateByKey } from '@/app/api/admin/email-templates/template-data';
import { NextRequest, NextResponse } from 'next/server';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    const { templateKey, recipientEmail } = body;

    if (!templateKey || typeof templateKey !== 'string') {
      return NextResponse.json(
        { error: 'Template key is required' },
        { status: 400 }
      );
    }

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const predefined = getPredefinedTemplateByKey(templateKey);
    if (!predefined) {
      return NextResponse.json(
        { error: 'Invalid template key' },
        { status: 400 }
      );
    }

    const emailData = await resolveEmailContent(
      templateKey,
      templateContextFromUser(session.user)
    );

    if (!emailData) {
      return NextResponse.json(
        {
          error:
            'No email template found. Create or configure the template in Admin → Email Templates first.',
        },
        { status: 404 }
      );
    }

    const emailSent = await sendMail({
      sendTo: recipientEmail,
      subject: emailData.subject,
      html: emailData.html,
      fromName: emailData.fromName ?? undefined,
    });

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${recipientEmail}`,
        data: {
          templateKey,
          recipient: recipientEmail,
          subject: emailData.subject,
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: String(error) },
      { status: 500 }
    );
  }
}
