
import { createEmailTemplate, emailContentSections, EmailLayoutData } from '../shared/email-layout';

export interface TransactionEmailData {
  userName: string;
  userEmail: string;
  transactionId: string;
  amount: string;
  currency?: string;
  date: string;
  userId?: string;
  phone?: string;
  supportEmail?: string;
  whatsappNumber?: string;
}

export const transactionTemplates = {

  paymentSuccess: (data: TransactionEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Payment Successful!',
      headerColor: 'primary-color',
      footerMessage: 'Thank you for your payment!',
      userEmail: data.userEmail,
      supportEmail: data.supportEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Great news! Your payment has been successfully processed and funds have been added to your account. You can now use these funds to place orders on our platform.
      </p>

      <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Transaction Details</h3>
        ${emailContentSections.infoTable([
          {label: 'Transaction ID', value: data.transactionId},
          {label: 'Amount', value: `${data.amount} ${data.currency || 'BDT'}`, valueColor: '#22c55e'},
          {label: 'Status', value: 'Approved', valueColor: '#22c55e'},
          {label: 'Date', value: data.date}
        ])}
      </div>

      ${emailContentSections.ctaButton('View Transaction History', `${process.env.NEXT_PUBLIC_APP_URL}/transactions`)}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        Thank you for choosing our service! If you have any questions, please don't hesitate to contact our support team.
      </p>
    `;

    return {
      subject: 'Payment Successful - Funds Added to Your Account',
      html: createEmailTemplate(layoutData, content)
    };
  },

  paymentCancelled: (data: TransactionEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Payment Cancelled',
      headerColor: 'primary-color',
      footerMessage: 'No charges were made to your account',
      userEmail: data.userEmail,
      supportEmail: data.supportEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        We regret to inform you that your payment could not be verified and has been cancelled by our admin team.
      </p>

      <div style="background-color: #fef2f2; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #ef4444;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Transaction Details</h3>
        ${emailContentSections.infoTable([
          {label: 'Transaction ID', value: data.transactionId},
          {label: 'Amount', value: `${data.amount} ${data.currency || 'BDT'}`, valueColor: '#ef4444'},
          {label: 'Status', value: 'Cancelled', valueColor: '#ef4444'},
          {label: 'Date', value: data.date}
        ])}
      </div>

      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What to do next:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">If you believe this is an error, please contact our support team</li>
          <li style="margin-bottom: 8px;">You can try making a new payment with correct transaction details</li>
          <li style="margin-bottom: 8px;">Ensure your transaction ID and phone number are accurate</li>
        </ul>
      </div>

      <div style="background-color: #e0f2fe; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Contact Support:</h3>
        <div style="color: #4b5563;">
          ${data.supportEmail || data.whatsappNumber ? `
          ${data.whatsappNumber ? (() => {
            const cleaned = data.whatsappNumber.replace(/[^\d+]/g, '');
            const numbersOnly = cleaned.replace(/^\+/, '');
            return `<p style="margin: 5px 0;"><strong>WhatsApp:</strong> <a href="https://wa.me/${numbersOnly}" style="color: #3b82f6; text-decoration: none;">${data.whatsappNumber}</a></p>`;
          })() : ''}
          <p style="margin: 5px 0;"><strong>Telegram:</strong> @Smmdoc</p>
          ${data.supportEmail ? `<p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${data.supportEmail}" style="color: #3b82f6; text-decoration: none;">${data.supportEmail}</a></p>` : ''}
          ` : `
          <p style="margin: 5px 0;"><strong>Telegram:</strong> @Smmdoc</p>
          `}
        </div>
      </div>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        We apologize for any inconvenience caused and appreciate your understanding.
      </p>
    `;

    return {
      subject: 'Payment Cancelled - Transaction Not Approved',
      html: createEmailTemplate(layoutData, content)
    };
  },

  adminPendingReview: (data: TransactionEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Payment Pending Review',
      headerColor: 'primary-color',
      footerMessage: 'This is an automated admin notification.',
      userEmail: 'admin@example.com',
      supportEmail: data.supportEmail
    };

    const content = `
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        A new payment requires manual verification and approval.
      </p>

      <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Transaction Details</h3>
        ${emailContentSections.infoTable([
          {label: 'User', value: `${data.userName} (${data.userEmail})`},
          ...(data.userId ? [{label: 'User ID', value: data.userId}] : []),
          {label: 'Transaction ID', value: data.transactionId},
          {label: 'Amount', value: `${data.amount} ${data.currency || 'BDT'}`, valueColor: '#f59e0b'},
          ...(data.phone ? [{label: 'Phone', value: data.phone}] : []),
          {label: 'Status', value: '⏳ Pending Manual Review', valueColor: '#f59e0b'},
          {label: 'Date', value: data.date}
        ])}
      </div>

      ${emailContentSections.ctaButton('Review Transaction', `${process.env.NEXT_PUBLIC_APP_URL}/admin/funds`)}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        Please log in to the admin dashboard to approve or cancel this transaction.
      </p>
    `;

    return {
      subject: 'Pending Payment Requires Manual Review',
      html: createEmailTemplate(layoutData, content)
    };
  },

  adminAutoApproved: (data: TransactionEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Payment Auto-Approved',
      headerColor: 'primary-color',
      footerMessage: 'This is an automated admin notification.',
      userEmail: 'admin@example.com',
      supportEmail: data.supportEmail
    };

    const content = `
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        A new payment has been automatically verified and approved.
      </p>

      <div style="background-color: #f0fdf4; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #22c55e;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Transaction Details</h3>
        ${emailContentSections.infoTable([
          {label: 'User', value: `${data.userName} (${data.userEmail})`},
          ...(data.userId ? [{label: 'User ID', value: data.userId}] : []),
          {label: 'Transaction ID', value: data.transactionId},
          {label: 'Amount', value: `${data.amount} ${data.currency || 'BDT'}`, valueColor: '#22c55e'},
          {label: 'Status', value: 'Auto-Approved', valueColor: '#22c55e'},
          {label: 'Date', value: data.date}
        ])}
      </div>

      ${emailContentSections.ctaButton('View Transaction History', `${process.env.NEXT_PUBLIC_APP_URL}/admin/transactions`)}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        The user's account balance has been automatically updated.
      </p>
    `;

    return {
      subject: 'Payment Auto-Approved - Funds Added',
      html: createEmailTemplate(layoutData, content)
    };
  },
};