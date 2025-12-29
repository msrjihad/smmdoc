
import { createEmailTemplate, emailContentSections, EmailLayoutData } from '../shared/email-layout';

export interface AnnouncementEmailData {
  userName: string;
  userEmail: string;
  announcementTitle: string;
  announcementContent: string;
  announcementType: 'general' | 'maintenance' | 'feature' | 'promotion' | 'security' | 'policy';
  date: string;
  actionUrl?: string;
  actionText?: string;
  expiryDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export const announcementTemplates = {
  userAnnouncement: (data: AnnouncementEmailData) => {
    const layoutData: EmailLayoutData = {
      title: data.announcementTitle,
      headerColor: 'primary-color',
      footerMessage: 'This is an automated announcement. Please do not reply to this email.',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}

      ${data.priority === 'urgent' || data.announcementType === 'security' ? `

      <div style="background-color: #fef2f2; border-radius: 12px; padding: 20px; margin: 0 0 30px 0; border-left: 4px solid #ef4444;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <h3 style="color: #ef4444; margin: 0; font-size: 18px; font-weight: bold;">Important Notice</h3>
        </div>
        <p style="color: #7f1d1d; margin: 0; font-weight: 600;">This announcement requires your immediate attention.</p>
      </div>
      ` : ''}

      <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <div style="color: #4b5563; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${data.announcementContent}</div>
      </div>

            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid ${
                data.announcementType === 'maintenance' ? '#f59e0b' :
                data.announcementType === 'security' ? '#ef4444' :
                data.announcementType === 'promotion' ? '#22c55e' :
                data.announcementType === 'feature' ? '#8b5cf6' :
                data.announcementType === 'policy' ? '#6b7280' :
                '#3b82f6'
              }; padding-bottom: 10px;">Announcement Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Type:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-transform: capitalize;">${data.announcementType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Priority:</td>
                  <td style="padding: 8px 0; color: ${
                    data.priority === 'urgent' ? '#ef4444' :
                    data.priority === 'high' ? '#f59e0b' :
                    data.priority === 'medium' ? '#3b82f6' :
                    '#22c55e'
                  }; font-weight: bold; text-transform: capitalize;">${data.priority || 'Medium'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Date:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.date}</td>
                </tr>
                ${data.expiryDate ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Valid Until:</td>
                  <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">${data.expiryDate}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${data.announcementType === 'maintenance' ? `

            <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What to Expect:</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Temporary service interruption during maintenance</li>
                <li style="margin-bottom: 8px;">All data and settings will be preserved</li>
                <li style="margin-bottom: 8px;">Service will resume automatically after completion</li>
                <li style="margin-bottom: 8px;">You'll receive a notification when maintenance is complete</li>
              </ul>
            </div>
            ` : data.announcementType === 'feature' ? `

            <div style="background-color: #f3e8ff; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What's New:</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Enhanced user experience and functionality</li>
                <li style="margin-bottom: 8px;">New features are available immediately</li>
                <li style="margin-bottom: 8px;">No action required from your side</li>
                <li style="margin-bottom: 8px;">Check out the new features in your dashboard</li>
              </ul>
            </div>
            ` : data.announcementType === 'promotion' ? `

            <div style="background-color: #ecfdf5; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #22c55e;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Special Offer Details:</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Limited time offer - don't miss out!</li>
                <li style="margin-bottom: 8px;">Available to all registered users</li>
                <li style="margin-bottom: 8px;">Terms and conditions apply</li>
                ${data.expiryDate ? `<li style="margin-bottom: 8px;">Offer expires on ${data.expiryDate}</li>` : ''}
              </ul>
            </div>
            ` : data.announcementType === 'security' ? `

            <div style="background-color: #fef2f2; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Security Recommendations:</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Review your account security settings</li>
                <li style="margin-bottom: 8px;">Update your password if recommended</li>
                <li style="margin-bottom: 8px;">Enable two-factor authentication</li>
                <li style="margin-bottom: 8px;">Report any suspicious activity immediately</li>
              </ul>
            </div>
            ` : ''}

      ${data.actionUrl && data.actionText ? emailContentSections.actionButtons([{
        text: data.actionText,
        url: data.actionUrl
      }]) : ''}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        ${data.announcementType === 'maintenance' ? 'We apologize for any inconvenience and appreciate your patience during this maintenance period.' :
          data.announcementType === 'security' ? 'Your account security is our top priority. Please take the recommended actions to keep your account safe.' :
          data.announcementType === 'promotion' ? 'Thank you for being a valued customer. We hope you enjoy this special offer!' :
          data.announcementType === 'feature' ? 'We\'re excited to bring you these new features. Enjoy the enhanced experience!' :
          data.announcementType === 'policy' ? 'Please review the updated information carefully. Contact support if you have any questions.' :
          'Thank you for your attention to this announcement. We appreciate your continued support.'}
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
  userNewsletter: (data: AnnouncementEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Newsletter',
      headerColor: 'primary-color',
      footerMessage: 'You\'re receiving this newsletter because you\'re a valued member of our community.',
      userEmail: data.userEmail
    };

    const content = `
      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">${data.announcementTitle}</h2>

      <div style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 30px 0; white-space: pre-wrap;">${data.announcementContent}</div>

      ${data.actionUrl && data.actionText ? emailContentSections.actionButtons([{
        text: data.actionText,
        url: data.actionUrl
      }]) : ''}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        Thank you for being part of our community. We appreciate your continued support and engagement!
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
};