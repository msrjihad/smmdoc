

import { getCustomEmailTemplate } from './get-custom-template';
import { getEmailLayoutDataFromSettings } from './get-email-layout-data';
import { createEmailTemplate } from './shared/email-layout';
import { replaceTemplateVariables, type EmailTemplateContext } from './replace-template-variables';

export interface ResolvedEmail {
  subject: string;
  fromName: string | null;
  html: string;
}

export async function resolveEmailContent(
  templateKey: string,
  context?: EmailTemplateContext
): Promise<ResolvedEmail | null> {
  const custom = await getCustomEmailTemplate(templateKey);
  if (!custom) return null;
  const layoutData = await getEmailLayoutDataFromSettings();
  const appUrl = layoutData.appUrl || process.env.NEXT_PUBLIC_APP_URL || '';
  const mergedContext: EmailTemplateContext = {
    ...context,
    sitename: layoutData.siteName,
    site_url: appUrl.replace(/\/$/, ''),
  };
  const subject = replaceTemplateVariables(custom.subject, mergedContext);
  const fromName = custom.fromName
    ? replaceTemplateVariables(custom.fromName, mergedContext)
    : custom.fromName;
  const bodyHtml = replaceTemplateVariables(custom.bodyHtml, mergedContext);
  const html = createEmailTemplate(layoutData, bodyHtml);
  return {
    subject,
    fromName,
    html,
  };
}
