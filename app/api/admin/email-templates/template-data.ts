export const EMAIL_CATEGORY_IDS = [2, 3, 4, 5, 6, 7, 8] as const;

export type EmailCategoryId = (typeof EMAIL_CATEGORY_IDS)[number];

export const AUDIENCE_ROLES = ['Admin', 'Moderator', 'User'] as const;
export type AudienceRole = (typeof AUDIENCE_ROLES)[number];

export interface PredefinedEmailCategory {
  id: EmailCategoryId;
  name: string;
  description: string;
  audience: AudienceRole[];
}

export interface PredefinedEmailTemplate {
  id: number;
  templateKey: string;
  categoryId: EmailCategoryId;
  name: string;
  description: string;
}

export const PREDEFINED_EMAIL_CATEGORIES: PredefinedEmailCategory[] = [
  {
    id: 2,
    name: 'Account',
    description: 'Welcome, account-related emails: email change, password change, verification, suspension.',
    audience: ['User'],
  },
  {
    id: 3,
    name: 'Transaction & Payments',
    description: 'Payment success, payment cancelled, and admin review status emails.',
    audience: ['User', 'Admin'],
  },
  {
    id: 4,
    name: 'New Order',
    description: 'Order confirmation and status updates sent to users.',
    audience: ['User', 'Admin'],
  },
  {
    id: 5,
    name: 'Support Ticket',
    description: 'Support ticket created, replied, and resolved notifications.',
    audience: ['User', 'Admin'],
  },
  {
    id: 6,
    name: 'Contact Message',
    description: 'Contact form submissions and admin reply notifications.',
    audience: ['User', 'Admin'],
  },
  {
    id: 7,
    name: 'Announcement',
    description: 'System announcements and broadcast emails to users.',
    audience: ['User'],
  },
  {
    id: 8,
    name: 'API',
    description: 'API key and integration-related email notifications.',
    audience: ['User'],
  },
];

export const PREDEFINED_EMAIL_TEMPLATES: PredefinedEmailTemplate[] = [
  { id: 1, templateKey: 'welcome', categoryId: 2, name: 'Greetings', description: 'Sent when a new user registers. Welcome message and get started CTA.' },
  { id: 2, templateKey: 'account_user_email_changed', categoryId: 2, name: 'Email Changed', description: 'Sent when user updates their email address.' },
  { id: 3, templateKey: 'account_user_password_changed', categoryId: 2, name: 'Password Changed', description: 'Sent when user changes their password.' },
  { id: 4, templateKey: 'account_user_account_verification', categoryId: 2, name: 'Verification', description: 'Email verification and account confirmation.' },
  { id: 5, templateKey: 'account_user_suspicious_login', categoryId: 2, name: 'Security Alert', description: 'Sent when suspicious login activity is detected.' },

  { id: 6, templateKey: 'transaction_payment_success', categoryId: 3, name: 'Payment Success', description: 'Sent to user when payment is completed successfully.' },
  { id: 7, templateKey: 'transaction_payment_cancelled', categoryId: 3, name: 'Payment Cancelled', description: 'Sent when user cancels a payment.' },
  { id: 8, templateKey: 'transaction_admin_pending_review', categoryId: 3, name: 'Pending Review', description: 'Sent to admin when payment awaits manual review.' },
  { id: 9, templateKey: 'transaction_admin_auto_approved', categoryId: 3, name: 'Auto Approved', description: 'Sent to admin when payment is auto-approved.' },

  { id: 10, templateKey: 'new-order_user_order_confirmation', categoryId: 4, name: 'Order Confirmation', description: 'Order confirmation sent to user after purchase.' },
  { id: 11, templateKey: 'new-order_admin_new_order', categoryId: 4, name: 'Admin New Order', description: 'Sent to admin when a new order is placed.' },
  { id: 12, templateKey: 'new-order_user_order_status_update', categoryId: 4, name: 'Order Status Update', description: 'Sent when order status changes (processing, completed, etc.).' },

  { id: 13, templateKey: 'support-ticket_user_ticket_created', categoryId: 5, name: 'Ticket Created', description: 'Sent to user when they create a support ticket.' },
  { id: 14, templateKey: 'support-ticket_admin_new_ticket', categoryId: 5, name: 'Admin New Ticket', description: 'Sent to admin when a new support ticket is created.' },
  { id: 15, templateKey: 'support-ticket_user_ticket_response', categoryId: 5, name: 'Ticket Reply', description: 'Sent to user when admin replies to their ticket.' },

  { id: 16, templateKey: 'contact-message_new_contact_message_admin', categoryId: 6, name: 'New Contact Message', description: 'Sent to admin when contact form is submitted.' },
  { id: 17, templateKey: 'contact-message_admin_reply_to_user', categoryId: 6, name: 'Admin Reply', description: 'Sent to user when admin replies to their contact message.' },

  { id: 18, templateKey: 'announcement_user_announcement', categoryId: 7, name: 'Announcement', description: 'System announcements and broadcast emails to users.' },
  { id: 19, templateKey: 'announcement_user_newsletter', categoryId: 7, name: 'Newsletter', description: 'Newsletter and periodic updates to subscribers.' },

  { id: 20, templateKey: 'api_user_api_key_generated', categoryId: 8, name: 'API Key Generated', description: 'Sent when user generates a new API key.' },
  { id: 21, templateKey: 'api_user_api_rate_limit_exceeded', categoryId: 8, name: 'Rate Limit Exceeded', description: 'Sent when API rate limit is exceeded.' },
  { id: 22, templateKey: 'api_user_api_error', categoryId: 8, name: 'API Error', description: 'Sent when critical API errors occur.' },
];

export function getPredefinedTemplatesByCategory(categoryId: EmailCategoryId): PredefinedEmailTemplate[] {
  return PREDEFINED_EMAIL_TEMPLATES.filter((t) => t.categoryId === categoryId);
}

export function getPredefinedCategory(id: EmailCategoryId | string | number): PredefinedEmailCategory | undefined {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return PREDEFINED_EMAIL_CATEGORIES.find((c) => c.id === numId);
}

export function getPredefinedTemplateById(id: number): PredefinedEmailTemplate | undefined {
  return PREDEFINED_EMAIL_TEMPLATES.find((t) => t.id === id);
}

export function getPredefinedTemplateByKey(templateKey: string): PredefinedEmailTemplate | undefined {
  return PREDEFINED_EMAIL_TEMPLATES.find((t) => t.templateKey === templateKey);
}

export const TEMPLATE_KEY_TO_SLUG: Record<string, string> = {
  welcome: 'welcome',
  account_user_email_changed: 'email-changed',
  account_user_password_changed: 'password-changed',
  account_user_account_verification: 'verification',
  account_user_suspicious_login: 'security-alert',
  transaction_payment_success: 'payment-success',
  transaction_payment_cancelled: 'payment-cancelled',
  transaction_admin_pending_review: 'pending-review',
  transaction_admin_auto_approved: 'auto-approved',
  'new-order_user_order_confirmation': 'order-confirmation',
  'new-order_admin_new_order': 'admin-new-order',
  'new-order_user_order_status_update': 'order-status-update',
  'support-ticket_user_ticket_created': 'ticket-created',
  'support-ticket_admin_new_ticket': 'admin-new-ticket',
  'support-ticket_user_ticket_response': 'ticket-reply',
  'contact-message_new_contact_message_admin': 'new-contact-message',
  'contact-message_admin_reply_to_user': 'admin-reply-to-user',
  announcement_user_announcement: 'announcement',
  announcement_user_newsletter: 'newsletter',
  api_user_api_key_generated: 'api-key-generated',
  api_user_api_rate_limit_exceeded: 'rate-limit-exceeded',
  api_user_api_error: 'api-error',
};

export const SLUG_TO_TEMPLATE_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(TEMPLATE_KEY_TO_SLUG).map(([k, v]) => [v, k])
);
