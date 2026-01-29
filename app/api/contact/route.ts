import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    const { contactDB } = await import('@/lib/contact-db');
    const contactSettings = await contactDB.getContactSettings();
    if (!contactSettings?.contactSystemEnabled) {
      return NextResponse.json(
        { error: 'Contact system is currently disabled' },
        { status: 403 }
      );
    }
    
    let adminEmail = '';
    try {
      const generalSettings = await db.generalSettings.findFirst();
      if (generalSettings?.supportEmail && generalSettings.supportEmail.trim() !== '') {
        adminEmail = generalSettings.supportEmail;
      } else if (generalSettings?.adminEmail) {
        adminEmail = generalSettings.adminEmail;
      }
    } catch (error) {
      console.error('Error fetching support/admin email from settings:', error);
    }
    
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Support email not configured' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { name, email, phone, subject, message, recaptchaToken } = body;

    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (recaptchaToken) {
      console.log('ReCAPTCHA token received:', recaptchaToken.substring(0, 20) + '...');
    }

    let contactMessageId = 0;
    try {
      const contactMessage = await db.contactMessages.create({
        data: {
          subject,
          message: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage: ${message}`,
          status: 'PENDING',
          userId: session?.user?.id ? parseInt(session.user.id) : 1,
          categoryId: 1,
        },
      });

      contactMessageId = contactMessage.id;
      console.log('Contact message created:', contactMessage.id);
    } catch (dbError) {
      console.error('Database error:', dbError);
      console.log('Contact form submission (no DB):', {
        name,
        email,
        phone,
        subject,
        message,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const { sendMail } = await import('@/lib/nodemailer');
      const { resolveEmailContent } = await import('@/lib/email-templates/resolve-email-content');
      const emailTemplate = await resolveEmailContent('contact-message_new_contact_message_admin', {
        user_full_name: name,
        user_email: email,
      });
      if (emailTemplate) {
        await sendMail({
          sendTo: adminEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          fromName: emailTemplate.fromName ?? undefined,
        });
      }
      
      console.log('Contact form email sent to admin:', adminEmail);
    } catch (emailError) {
      console.error('Error sending contact form email to admin:', emailError);
    }

    console.log('Contact form submission received:', {
      name,
      email,
      subject,
      adminEmail: adminEmail,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Your message has been sent successfully. We will get back to you soon!' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
