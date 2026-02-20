export interface PredefinedTemplateBody {
  subject: string;
  fromName?: string | null;
  bodyHtml: string;
}

export const PREDEFINED_TEMPLATE_BODIES: Record<string, PredefinedTemplateBody> = {
  "account_user_account_verification": {
    subject: `Verification Code for {sitename}`,
    fromName: "{sitename}",
    bodyHtml: `<p>Hi {username},</p><p>Your verification code is:</p><h3>{otp}</h3><p>Please enter this code to verify. This code will expire in <strong>15 minutes</strong>.</p><p>Regards,<br>{sitename} Team</p>`,
  },
  "account_user_email_changed": {
    subject: `Your email address has been changed`,
    fromName: "{sitename}",
    bodyHtml: `<p>Hi {username},</p><p>Your email address has been changed to {user_email}.</p><p>If you do it, ignore this email. Otherwise, contact us immediately.</p><p>Regards,<br>{sitename} Team</p><p></p>`,
  },
  "account_user_password_changed": {
    subject: `Your password has been changed`,
    fromName: "{sitename}",
    bodyHtml: `<p>Hi {username},</p><p>Your password has been changed successfully.</p><p>Ignore this email if you do it. Otherwise, contact us immediately.</p><p>Regards,<br>{sitename} Team</p>`,
  },
  "api_user_api_key_generated": {
    subject: `New API Key Generated`,
    fromName: "{sitename}",
    bodyHtml: `<p>Hi {username},</p><p>A new API key has been generated for your account.</p><p>If this was not you, please contact us immediately. Otherwise, you can safely ignore this email.</p><p>Regards,<br>{sitename} Team</p>`,
  },
  "contact-message_admin_reply_to_user": {
    subject: `RE: {message_subject} - #{contact_message_id}`,
    fromName: "{sitename}",
    bodyHtml: `<p>{admin_message}</p><p>--</p><p style="text-align: center;"><strong><u>Your Message Body</u></strong></p><p>{user_message}</p>`,
  },
  "transaction_payment_cancelled": {
    subject: `Payment Cancelled`,
    fromName: "{sitename}",
    bodyHtml: `<p>Hi {username},</p><p>Your payment could not be completed due to an error. No amount has been added to your {sitename} account.</p><p>Please try again or contact support if the issue continues.</p><p>Regards,<br>{sitename} Team</p><p></p>`,
  },
  "transaction_payment_success": {
    subject: `Payment Success`,
    fromName: "{sitename}",
    bodyHtml: `<p>Hi {username},</p><p>\${fund_amount} has been successfully added to your {sitename} account.</p><ul><li><p>Amount: \${fund_amount}</p></li><li><p>Transaction ID: {transaction_id}</p></li></ul><p></p><p>Your balance is now updated.</p><p>Regards,<br>{sitename} Team</p><p></p>`,
  },
  "transaction_user_payment_pending": {
    subject: `Your Transaction is Pending`,
    fromName: "{sitename}",
    bodyHtml: `<p>Hi {username},</p><p>\${fund_amount} amount of your transaction is currently <strong>pending</strong>.</p><p>Once it is confirmed, the amount will be added to your {sitename} account. If it stays pending for a long time, please contact support.</p><p>Regards,<br>{sitename} Team</p>`,
  },
  "welcome": {
    subject: `Welcome to {sitename}`,
    fromName: "{sitename}",
    bodyHtml: `<p>Hi {username},</p><p>Your account has been successfully created on {sitename}.<br>You can now log in and start using our services.</p><p>Login Link: {site_url}/sign-in</p><p>If you need help, contact our support anytime.</p><p>Regards,<br>{sitename} Team</p>`,
  },
};

export function getPredefinedTemplateBody(templateKey: string): PredefinedTemplateBody | null {
  return PREDEFINED_TEMPLATE_BODIES[templateKey] ?? null;
}
