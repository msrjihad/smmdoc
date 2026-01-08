import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Contact Support POST - Session user:', session.user);

    const data = await request.formData();
    const subject = data.get('subject') as string;
    const category = data.get('category') as string;
    const message = data.get('message') as string;
    const files = data.getAll('attachments') as File[];

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    const { contactDB } = await import('@/lib/contact-db');

    const contactSettings = await contactDB.getContactSettings();
    if (!contactSettings?.contactSystemEnabled) {
      return NextResponse.json(
        { error: 'Contact system is currently disabled' },
        { status: 403 }
      );
    }

    const maxPendingContactsStr = contactSettings.maxPendingContacts || '3';

    if (maxPendingContactsStr.toLowerCase() !== 'unlimited') {
      const { db } = await import('@/lib/db');
      const userPendingCount = await db.contactMessages.count({
        where: {
          userId: session.user.id,
          OR: [
            { adminReply: null },
            { adminReply: '' }
          ]
        }
      });
      const maxPendingContacts = parseInt(maxPendingContactsStr);

      if (userPendingCount >= maxPendingContacts) {
        return NextResponse.json(
          {
            error: `You have reached the maximum limit of ${maxPendingContacts} pending contacts. Please wait for a response to your previous messages.`
          },
          { status: 429 }
        );
      }
    }

    const categories = await contactDB.getContactCategories();
    const categoryExists = categories.some((cat) => cat.id === parseInt(category));

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Invalid category selected' },
        { status: 400 }
      );
    }

    let attachmentsJson = null;
    if (files && files.length > 0) {
      const uploadedFiles = [];
      
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
      }
      
      for (const file of files) {
        if (file && file.name && file.size > 0) {
          if (file.size > 5 * 1024 * 1024) {
            continue;
          }
          
          const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
          
          if (!allowedTypes.includes(file.type)) {
            continue;
          }
          
          try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const fileExtension = path.extname(file.name);
            const randomBytes = crypto.randomBytes(16).toString('hex');
            const timestamp = Date.now().toString();
            const hash = crypto.createHash('sha256').update(`${file.name}${timestamp}${randomBytes}`).digest('hex');
            const encryptedFilename = `${hash.substring(0, 16)}${fileExtension}`;
            const filepath = path.join(uploadsDir, encryptedFilename);
            
            await writeFile(filepath, buffer);
            
            uploadedFiles.push({
              originalName: file.name,
              encryptedName: encryptedFilename,
              fileUrl: `/uploads/${encryptedFilename}`,
              fileSize: file.size,
              mimeType: file.type
            });
          } catch (error) {
            console.error(`Error uploading file ${file.name}:`, error);
          }
        }
      }
      
      if (uploadedFiles.length > 0) {
        attachmentsJson = JSON.stringify(uploadedFiles);
      }
    }

    let messageId = 0;
    try {
      const { db } = await import('@/lib/db');
      const contactMessage = await db.contactMessages.create({
        data: {
          userId: session.user.id,
          subject: subject.trim(),
          message: message.trim(),
          categoryId: parseInt(category),
          attachments: attachmentsJson || null,
          status: 'Unread'
        }
      });
      messageId = contactMessage.id;
    } catch (dbError) {
      console.error('Error creating contact message:', dbError);
      const result = await contactDB.createContactMessage({
        userId: session.user.id,
        subject: subject.trim(),
        message: message.trim(),
        categoryId: parseInt(category),
        attachments: attachmentsJson || undefined
      });
      
      if (result) {
        const messages = await contactDB.getContactMessages({
          search: subject.trim(),
          limit: 1
        });
        messageId = messages.length > 0 ? messages[0].id : 0;
      }
    }

    const userEmail = session.user.email;
    const userName = session.user.name || session.user.username || 'User';
    const userUsername = session.user.username || 'User';

    try {
      const { sendMail } = await import('@/lib/nodemailer');
      const { contactEmailTemplates } = await import('@/lib/email-templates');
      const { sendSMS } = await import('@/lib/sms');
      const { smsTemplates } = await import('@/lib/sms');
      
      const { getFromEmailAddress } = await import('@/lib/email-config');
      const { getSupportEmail, getWhatsAppNumber } = await import('@/lib/utils/general-settings');
      const adminEmail = process.env.ADMIN_EMAIL || await getFromEmailAddress();
      const supportEmail = await getSupportEmail();
      const whatsappNumber = await getWhatsAppNumber();
      
      if (adminEmail) {
        const emailTemplate = contactEmailTemplates.newContactMessageAdmin({
          userName,
          userEmail: userEmail || 'No email',
          subject: subject.trim(),
          message: message.trim(),
          category: categories.find(cat => cat.id === parseInt(category))?.name || 'Unknown',
          messageId: messageId,
          attachments: attachmentsJson ? JSON.parse(attachmentsJson) : undefined,
          supportEmail: supportEmail,
          whatsappNumber: whatsappNumber
        });
        
        await sendMail({
          sendTo: adminEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });
      }
      
      const adminPhone = process.env.ADMIN_PHONE;
      if (adminPhone) {
        const smsMessage = smsTemplates.newContactMessageAdminSMS(userName, subject.trim());
        await sendSMS({
          to: adminPhone,
          message: smsMessage
        });
      }
      
    } catch (notificationError) {
      console.error('Error sending admin notification:', notificationError);
    }

    if (messageId > 0) {
      try {
        const { sendAdminNewMessageNotification } = await import('@/lib/notifications/admin-notifications');
        await sendAdminNewMessageNotification(
          messageId,
          subject.trim(),
          userUsername
        );
      } catch (notificationError) {
        console.error('Error sending admin new message notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.'
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Contact Support GET - Session user:', session.user);

    const { contactDB } = await import('@/lib/contact-db');

    const contactSettings = await contactDB.getContactSettings();

    if (!contactSettings?.contactSystemEnabled) {
      return NextResponse.json(
        { error: 'Contact system is currently disabled' },
        { status: 403 }
      );
    }

    const categories = await contactDB.getContactCategories();

    const maxPendingContactsStr = contactSettings.maxPendingContacts || '3';
    let userPendingCount = 0;
    let canSubmit = true;

    if (maxPendingContactsStr.toLowerCase() === 'unlimited') {
      canSubmit = true;
    } else {
      const { db } = await import('@/lib/db');
      userPendingCount = await db.contactMessages.count({
        where: {
          userId: session.user.id,
          OR: [
            { adminReply: null },
            { adminReply: '' }
          ]
        }
      });
      const maxPendingContacts = parseInt(maxPendingContactsStr);
      canSubmit = userPendingCount < maxPendingContacts;
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: categories.map((cat) => ({
          id: cat.id,
          name: cat.name
        })),
        userPendingCount,
        maxPendingContacts: maxPendingContactsStr,
        canSubmit
      }
    });

  } catch (error) {
    console.error('Error getting contact form data:', error);
    return NextResponse.json(
      { error: 'Failed to load contact form data' },
      { status: 500 }
    );
  }
}
