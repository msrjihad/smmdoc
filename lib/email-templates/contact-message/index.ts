
export interface ContactMessageEmailData {
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: string;
  messageId: number;
  supportEmail?: string;
  whatsappNumber?: string;
  attachments?: Array<{
    originalName: string;
    encryptedName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export interface AdminReplyEmailData {
  userName: string;
  subject: string;
  adminReply: string;
  adminName: string;
  messageId: number;
  originalMessage: string;
  supportEmail?: string;
  whatsappNumber?: string;
  attachments?: Array<{
    originalName: string;
    encryptedName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export const contactMessageTemplates = {

  newContactMessageAdmin: ({
    userName,
    userEmail,
    subject,
    message,
    category,
    messageId,
    attachments,
    supportEmail,
    whatsappNumber
  }: ContactMessageEmailData) => ({
    subject: `New Contact Message - ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Message</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

          <div style="background: linear-gradient(135deg, #5f1de8 0%, #b131f8 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">New Contact Message</h1>
          </div>

          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello Admin,</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              A new contact message has been submitted through the website. Please review the details below.
            </p>

            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #5f1de8; padding-bottom: 10px;">Message Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">From:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${userName} (${userEmail})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Category:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Subject:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${subject}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Message:</h4>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; white-space: pre-line; margin: 0;">${message}</p>
            </div>

            ${attachments && attachments.length > 0 ? `

            <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Attachments (${attachments.length}):</h4>
              ${attachments.map(attachment => `
                <div style="display: flex; align-items: center; padding: 10px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px;">
                  <div style="flex: 1;">
                    <div style="color: #1f2937; font-weight: 600; margin-bottom: 4px;">
                       <a style="color: linear-gradient(135deg, #5f1de8 0%, #b131f8 100%)" href="${process.env.NEXT_PUBLIC_APP_URL}${attachment.fileUrl}">${attachment.encryptedName}</a>
                     </div>
                    <div style="color: #6b7280; font-size: 14px;">${Math.round(attachment.fileSize / 1024)} KB</div>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/contact-messages/${messageId}" 
                 style="background: linear-gradient(135deg, #5f1de8 0%, #b131f8 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(95, 29, 232, 0.3);">
                View Message in Admin Panel
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              This message was sent through the contact form on SMMDOC.
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This is an automated notification from SMMDOC Contact System.
            </p>
            ${supportEmail || whatsappNumber ? `
            <div style="margin-top: 20px;">
              ${whatsappNumber ? (() => {
                const cleaned = whatsappNumber.replace(/[^\d+]/g, '');
                const numbersOnly = cleaned.replace(/^\+/, '');
                return `<a href="https://wa.me/${numbersOnly}" style="color: #22c55e; text-decoration: none; margin: 0 10px;">WhatsApp</a>`;
              })() : ''}
              <a href="https://t.me/Smmdoc" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">Telegram</a>
              ${supportEmail ? `<a href="mailto:${supportEmail}" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Email Support</a>` : ''}
            </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  adminReplyToUser: ({
    userName,
    subject,
    adminReply,
    adminName,
    messageId,
    originalMessage,
    attachments
  }: AdminReplyEmailData) => ({
    subject: `RE: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RE: ${subject}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        </style>
      </head>
      <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; color: #202124;">
        <div style="max-width: 680px; margin: 0 auto;">

          <div style="line-height: 1.6; font-size: 14px; color: #202124;">
            <div style="margin-bottom: 20px;">
              <div style="white-space: pre-line;">${adminReply}</div>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e8eaed;">
              <div style="color: #5f6368; font-size: 13px; margin-bottom: 10px;">
                On ${new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}, ${userName} wrote:
              </div>
              <div style="border-left: 2px solid #e8eaed; padding-left: 10px; color: #5f6368; font-size: 13px;">
                <div style="font-weight: 500; margin-bottom: 5px;">Subject: ${subject}</div>
                <div style="white-space: pre-line; margin-bottom: 15px;">${originalMessage}</div>

                ${attachments && attachments.length > 0 ? `
                <div style="margin-top: 15px;">
                  <div style="font-weight: 500; margin-bottom: 10px; color: #5f6368;">Attachments (${attachments.length}):</div>
                  ${attachments.map(attachment => `
                    <div style="display: flex; align-items: center; padding: 8px; background-color: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px;">
                      <div style="flex: 1;">
                        <div style="color: #202124; font-weight: 500; font-size: 12px; margin-bottom: 2px;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}${attachment.fileUrl}">${attachment.encryptedName}</a>
                        </div>
                        <div style="color: #5f6368; font-size: 11px;">${Math.round(attachment.fileSize / 1024)} KB</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                ` : ''}
              </div>
            </div>
          </div>

        </div>
      </body>
      </html>
    `,
  })
};