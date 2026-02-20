export const EMAIL_CATEGORY_IDS = [2, 3, 6, 8] as const;

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
    description: 'Welcome, account-related emails: password change, verification, suspension.',
    audience: ['User'],
  },
  {
    id: 3,
    name: 'Transaction & Payments',
    description: 'Payment success and payment cancelled emails sent to users.',
    audience: ['User'],
  },
  {
    id: 6,
    name: 'Contact Message',
    description: 'Admin reply notifications sent to users.',
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
  { id: 1, templateKey: 'welcome', categoryId: 2, name: 'Greetings', description: 'Sent when a user creates a new account and verifies their email address.' },
  { id: 3, templateKey: 'account_user_password_changed', categoryId: 2, name: 'Password Changed', description: 'Sent when user changes password from account-settings page or via forgot password (reset-password flow).' },
  { id: 4, templateKey: 'account_user_account_verification', categoryId: 2, name: 'Verification', description: 'Sent for password reset, email change, sign-up, unverified login, 2FA, or email verification. {otp} is the generated code.' },

  { id: 6, templateKey: 'transaction_payment_success', categoryId: 3, name: 'Payment Success', description: 'Sent when user adds fund and status is Success.' },
  { id: 7, templateKey: 'transaction_payment_cancelled', categoryId: 3, name: 'Payment Cancelled', description: 'Sent when add fund status is cancelled.' },
  { id: 9, templateKey: 'transaction_user_payment_pending', categoryId: 3, name: 'Payment Pending', description: 'Sent when payment status is pending/processing for review.' },

  { id: 17, templateKey: 'contact-message_admin_reply_to_user', categoryId: 6, name: 'Admin Message Reply', description: 'Sent when admin replies from admin/contact-messages/[id] page.' },

  { id: 20, templateKey: 'api_user_api_key_generated', categoryId: 8, name: 'API Key Generated', description: 'Sent when user generates a new API key.' },
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
  account_user_password_changed: 'password-changed',
  account_user_account_verification: 'verification',
  transaction_payment_success: 'payment-success',
  transaction_payment_cancelled: 'payment-cancelled',
  transaction_user_payment_pending: 'payment-pending',
  'contact-message_admin_reply_to_user': 'admin-reply-to-user',
  api_user_api_key_generated: 'api-key-generated',
};

export const SLUG_TO_TEMPLATE_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(TEMPLATE_KEY_TO_SLUG).map(([k, v]) => [v, k])
);

export const TEMPLATE_TRIGGERS: Record<string, string> = {
  'contact-message_admin_reply_to_user': 'Admin replies from admin/contact-messages/[id] page.',
};

export interface TemplateVariableDef {
  placeholder: string;
  description: string;
}

export const TEMPLATE_SPECIFIC_VARIABLES: Record<string, TemplateVariableDef[]> = {
  'contact-message_admin_reply_to_user': [
    { placeholder: '{user_message}', description: 'User message conversation' },
    { placeholder: '{contact_message_id}', description: 'Contact message ID' },
    { placeholder: '{message_subject}', description: 'Message subject line' },
    { placeholder: '{admin_message}', description: 'Admin\'s replied conversation' },
  ],
};

export function getTemplateTrigger(templateKey: string): string {
  return TEMPLATE_TRIGGERS[templateKey] ?? getPredefinedTemplateByKey(templateKey)?.description ?? '';
}

export function getTemplateSpecificVariables(templateKey: string): TemplateVariableDef[] {
  return TEMPLATE_SPECIFIC_VARIABLES[templateKey] ?? [];
}
