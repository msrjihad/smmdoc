
import { createEmailTemplate, emailContentSections, EmailLayoutData } from '../shared/email-layout';

export interface SupportTicketEmailData {
  userName: string;
  userEmail: string;
  ticketId: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  date: string;
  userId?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminResponse?: string;
  supportEmail?: string;
  whatsappNumber?: string;
}

export const supportTicketTemplates = {

  userTicketCreated: (data: SupportTicketEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Support Ticket Created',
      headerColor: 'primary-color',
      footerMessage: 'This is an automated message. Please do not reply to this email.',
      userEmail: data.userEmail,
      supportEmail: data.supportEmail,
      whatsappNumber: data.whatsappNumber
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for contacting our support team. Your ticket has been successfully created and assigned a unique ID. Our team will review your request and respond as soon as possible.
      </p>

      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Ticket Details</h3>
        ${emailContentSections.infoTable([
          {label: 'Ticket ID', value: `#${data.ticketId}`},
          {label: 'Subject', value: data.subject},
          {label: 'Category', value: data.category},
          {label: 'Priority', value: data.priority, valueColor: data.priority === 'urgent' ? '#ef4444' : data.priority === 'high' ? '#f59e0b' : data.priority === 'medium' ? '#3b82f6' : '#22c55e'},
          {label: 'Status', value: 'Open', valueColor: '#3b82f6'},
          {label: 'Created', value: data.date}
        ])}
      </div>

      <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Your Message:</h3>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.message}</p>
      </div>

      <div style="background-color: #e0f2fe; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Expected Response Time:</h3>
        <p style="color: #4b5563; margin: 0;">
          ${data.priority === 'urgent' ? '• Urgent tickets: Within 2-4 hours' : 
            data.priority === 'high' ? '• High priority tickets: Within 4-8 hours' :
            data.priority === 'medium' ? '• Medium priority tickets: Within 12-24 hours' :
            '• Low priority tickets: Within 24-48 hours'}
        </p>
      </div>

      ${emailContentSections.actionButtons([
        {text: 'View Ticket Status', url: `${process.env.NEXT_PUBLIC_APP_URL}/support/tickets/${data.ticketId}`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        You will receive email notifications when our team responds to your ticket. Thank you for your patience!
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },

  adminNewTicket: (data: SupportTicketEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'New Support Ticket',
      headerColor: 'primary-color',
      footerMessage: 'Admin notification - please respond promptly',
      userEmail: data.userEmail,
      supportEmail: data.supportEmail,
      whatsappNumber: data.whatsappNumber
    };

    const content = `
      <div style="background-color: #fef2f2; border-radius: 12px; padding: 25px; margin: 0 0 30px 0; border-left: 4px solid #ef4444;">
        <h2 style="color: #dc2626; margin: 0 0 10px 0; font-size: 20px;">Priority Alert!</h2>
        <p style="color: #7f1d1d; font-size: 16px; margin: 0;">A new ${data.priority} priority support ticket requires immediate attention.</p>
      </div>

      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Ticket Information</h3>
        ${emailContentSections.infoTable([
          {label: 'Ticket ID', value: `#${data.ticketId}`},
          {label: 'Customer', value: data.userName},
          {label: 'Email', value: data.userEmail, valueColor: '#3b82f6'},
          {label: 'Subject', value: data.subject},
          {label: 'Category', value: data.category},
          {label: 'Priority', value: data.priority, valueColor: data.priority === 'urgent' ? '#ef4444' : data.priority === 'high' ? '#f59e0b' : data.priority === 'medium' ? '#3b82f6' : '#22c55e'},
          {label: 'Created', value: data.date}
        ])}
      </div>

      <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Customer Message:</h3>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.message}</p>
      </div>

      <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">Response Time Target:</h3>
        <p style="color: #78350f; margin: 0;">
          ${data.priority === 'urgent' ? 'URGENT: Respond within 2-4 hours' : 
            data.priority === 'high' ? 'HIGH: Respond within 4-8 hours' :
            data.priority === 'medium' ? 'MEDIUM: Respond within 12-24 hours' :
            'LOW: Respond within 24-48 hours'}
        </p>
      </div>

      ${emailContentSections.actionButtons([
        {text: 'Respond to Ticket', url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/support/tickets/${data.ticketId}`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        Please respond to this ticket promptly to maintain customer satisfaction.
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },

  userTicketResponse: (data: SupportTicketEmailData & { adminResponse: string; adminName: string }) => {
    const layoutData: EmailLayoutData = {
      title: 'We\'ve Responded!',
      headerColor: 'primary-color',
      footerMessage: 'We\'re here to help you!',
      userEmail: data.userEmail,
      supportEmail: data.supportEmail,
      whatsappNumber: data.whatsappNumber
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Great news! Our support team has responded to your ticket. Here's the update:
      </p>

      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Ticket Details</h3>
        ${emailContentSections.infoTable([
          {label: 'Ticket ID', value: `#${data.ticketId}`},
          {label: 'Subject', value: data.subject},
          {label: 'Status', value: 'Responded', valueColor: '#22c55e'},
          {label: 'Responded by', value: data.adminName}
        ])}
      </div>

      <div style="background-color: #ecfdf5; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #22c55e;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Our Response:</h3>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.adminResponse}</p>
      </div>

      ${emailContentSections.actionButtons([
        {text: 'View Full Conversation', url: `${process.env.NEXT_PUBLIC_APP_URL}/support/tickets/${data.ticketId}`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        If you need further assistance, please reply to this ticket or create a new one. We're here to help!
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
};