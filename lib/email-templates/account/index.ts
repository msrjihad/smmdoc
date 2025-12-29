
import { createEmailTemplate, emailContentSections, EmailLayoutData } from '../shared/email-layout';

export interface AccountEmailData {
  userName: string;
  userEmail: string;
  oldEmail?: string;
  newEmail?: string;
  oldPassword?: boolean;
  newPassword?: boolean;
  loginTime?: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  date: string;
  userId?: string;
  verificationCode?: string;
  resetToken?: string;
  accountStatus?: string;
  suspensionReason?: string;
}

export const accountTemplates = {
  userEmailChanged: (data: AccountEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Email Address Updated',
      headerColor: 'primary-color',
      footerMessage: 'This is an automated message. Please do not reply to this email.',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Your email address has been successfully updated. This change will take effect immediately for all future communications.
      </p>

      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Change Details</h3>
        ${emailContentSections.infoTable([
          ...(data.oldEmail ? [{label: 'Previous Email', value: data.oldEmail}] : []),
          ...(data.newEmail ? [{label: 'New Email', value: data.newEmail, valueColor: '#22c55e'}] : []),
          {label: 'Changed On', value: data.date},
          ...(data.ipAddress ? [{label: 'IP Address', value: data.ipAddress}] : []),
          ...(data.device ? [{label: 'Device', value: data.device}] : [])
        ])}
      </div>

            <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Security Notice:</h3>
              <p style="color: #4b5563; margin: 0 0 15px 0;">If you did not make this change, please contact our support team immediately. Your account security is important to us.</p>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">All future notifications will be sent to your new email address</li>
                <li style="margin-bottom: 8px;">Your login credentials remain the same</li>
                <li style="margin-bottom: 8px;">Consider updating your password for additional security</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); margin-right: 10px;">
                Manage Account
              </a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" 
                 style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);">
                Contact Support
              </a>
            </div>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
              Thank you for keeping your account information up to date. If you have any questions, please don't hesitate to contact us.
            </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
  userPasswordChanged: (data: AccountEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Password Updated',
      headerColor: 'primary-color',
      footerMessage: 'This is an automated security notification. Please do not reply to this email.',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Your account password has been successfully changed. Your account is now secured with your new password.
      </p>

      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Security Update</h3>
        ${emailContentSections.infoTable([
          {label: 'Status', value: 'Password Updated', valueColor: '#22c55e'},
          {label: 'Changed On', value: data.date},
          ...(data.ipAddress ? [{label: 'IP Address', value: data.ipAddress}] : []),
          ...(data.device ? [{label: 'Device', value: data.device}] : []),
          ...(data.location ? [{label: 'Location', value: data.location}] : [])
        ])}
      </div>

      ${emailContentSections.alertBox(`
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">If you did not change your password, your account may be compromised.</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Contact our support team immediately</li>
          <li style="margin-bottom: 8px;">Review your recent account activity</li>
          <li style="margin-bottom: 8px;">Enable two-factor authentication if not already active</li>
          <li style="margin-bottom: 8px;">Check for any unauthorized changes to your account</li>
        </ul>
      `)}

      ${emailContentSections.actionButtons([
        {text: 'Security Settings', url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/security`},
        {text: 'Report Issue', url: `${process.env.NEXT_PUBLIC_APP_URL}/support`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        Your account security is our priority. If you have any concerns or questions, please contact our support team immediately.
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
  userSuspiciousLogin: (data: AccountEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Security Alert',
      headerColor: 'primary-color',
      footerMessage: 'This is an automated security alert. Please do not reply to this email.',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        We've detected a login to your account from an unusual location or device. If this was you, you can ignore this message. If not, please take immediate action to secure your account.
      </p>

      <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Login Details</h3>
        ${emailContentSections.infoTable([
          ...(data.loginTime ? [{label: 'Login Time', value: data.loginTime}] : []),
          ...(data.ipAddress ? [{label: 'IP Address', value: data.ipAddress}] : []),
          ...(data.device ? [{label: 'Device', value: data.device}] : []),
          ...(data.location ? [{label: 'Location', value: data.location}] : []),
          {label: 'Status', value: 'Suspicious Activity', valueColor: '#f59e0b'}
        ])}
      </div>

      ${emailContentSections.alertBox(`
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">If this wasn't you:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Change your password immediately</li>
          <li style="margin-bottom: 8px;">Enable two-factor authentication</li>
          <li style="margin-bottom: 8px;">Review your recent account activity</li>
          <li style="margin-bottom: 8px;">Contact our support team</li>
          <li style="margin-bottom: 8px;">Log out of all devices</li>
        </ul>
      `)}

            <div style="background-color: #f0fdf4; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #22c55e;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">If this was you:</h3>
              <p style="color: #4b5563; margin: 0 0 15px 0;">You can safely ignore this email. However, we recommend:</p>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Adding this device to your trusted devices</li>
                <li style="margin-bottom: 8px;">Enabling two-factor authentication for extra security</li>
                <li style="margin-bottom: 8px;">Using a VPN if you frequently travel</li>
              </ul>
            </div>

      ${emailContentSections.actionButtons([
        {text: 'Secure My Account', url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/security`},
        {text: 'View Activity', url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/activity`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        We take your account security seriously. If you have any concerns or need assistance, please contact our support team immediately.
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
  userAccountVerification: (data: AccountEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'Verify Your Account',
      headerColor: 'primary-color',
      footerMessage: 'This verification code expires in 15 minutes.',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for creating an account with us! To complete your registration and start using all our features, please verify your email address.
      </p>

      ${data.verificationCode ? `
      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Your Verification Code</h3>
        <div style="background-color: #ffffff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; display: inline-block; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px;">
          ${data.verificationCode}
        </div>
        <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0;">This code expires in 15 minutes</p>
      </div>
      ` : ''}

      <div style="background-color: #e0f2fe; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Verification Steps:</h3>
        <ol style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Copy the verification code above</li>
          <li style="margin-bottom: 8px;">Return to the verification page in your browser</li>
          <li style="margin-bottom: 8px;">Paste the code in the verification field</li>
          <li style="margin-bottom: 8px;">Click "Verify Account" to complete the process</li>
        </ol>
      </div>

      <div style="background-color: #f0fdf4; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #22c55e;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">After verification, you'll be able to:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Access all premium features</li>
          <li style="margin-bottom: 8px;">Receive important account notifications</li>
          <li style="margin-bottom: 8px;">Reset your password if needed</li>
          <li style="margin-bottom: 8px;">Enjoy full account security</li>
        </ul>
      </div>

      ${emailContentSections.actionButtons([{
        text: 'Verify My Account',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/verify-account`
      }])}

      <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 30px 0;">
        <h4 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">Need Help?</h4>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">If you're having trouble with verification or didn't request this account, please contact our support team.</p>
      </div>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        Welcome to our platform! We're excited to have you on board.
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
};