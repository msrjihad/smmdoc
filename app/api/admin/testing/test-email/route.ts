import { auth } from '@/auth';
import { sendMail } from '@/lib/nodemailer';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { NextRequest, NextResponse } from 'next/server';

const TEMPLATE_KEYS: Record<string, string> = {
  payment_success: 'transaction_payment_success',
  payment_cancelled: 'transaction_payment_cancelled',
  payment_pending: 'transaction_user_payment_pending',
};

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
    const { type } = body;
    
    const templateKey = TEMPLATE_KEYS[type];
    if (!templateKey) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      );
    }
    
    const testEmail = session.user.email || process.env.ADMIN_EMAIL || 'admin@example.com';
    const baseContext = templateContextFromUser(session.user);
    const context = ['transaction_payment_success', 'transaction_payment_cancelled', 'transaction_user_payment_pending'].includes(templateKey)
      ? { ...baseContext, fund_amount: '100.00', transaction_id: 'TXN-12345' }
      : baseContext;
    const emailData = await resolveEmailContent(templateKey, context);
    
    if (!emailData) {
      return NextResponse.json(
        { error: 'No email template found for this type. Create the template in Admin → Email Templates first.' },
        { status: 404 }
      );
    }
    
    const emailSent = await sendMail({
      sendTo: testEmail,
      subject: emailData.subject,
      html: emailData.html,
      fromName: emailData.fromName ?? undefined,
    });
    
    if (emailSent) {
      console.log(`Test email sent successfully to ${testEmail}`);
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        data: {
          type,
          recipient: testEmail,
          subject: emailData.subject
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email' },
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
