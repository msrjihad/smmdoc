

export interface EmailTemplateContext {
  sitename?: string;
  site_url?: string;
  username?: string;
  user_full_name?: string;
  user_email?: string;
  user_id?: string;
  otp?: string;
  fund_amount?: string;
  transaction_id?: string;
  user_message?: string;
  contact_message_id?: string;
  message_subject?: string;
  admin_message?: string;
}

const PLACEHOLDERS: (keyof EmailTemplateContext)[] = [
  'sitename',
  'site_url',
  'username',
  'user_full_name',
  'user_email',
  'user_id',
  'otp',
  'fund_amount',
  'transaction_id',
  'user_message',
  'contact_message_id',
  'message_subject',
  'admin_message',
];

export function replaceTemplateVariables(
  text: string,
  context: EmailTemplateContext
): string {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const key of PLACEHOLDERS) {
    const value = context[key];
    const replacement = value != null ? String(value) : '';
    const placeholder = `{${key}}`;
    result = result.split(placeholder).join(replacement);
  }
  return result;
}

 
export function templateContextFromUser(user: {
  id?: number | string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
}): EmailTemplateContext {
  return {
    user_id: user.id != null ? String(user.id) : '',
    username: user.username ?? '',
    user_full_name: user.name ?? '',
    user_email: user.email ?? '',
  };
}
