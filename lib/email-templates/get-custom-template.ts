import { db } from '@/lib/db';
import { getPredefinedTemplateBody } from './predefined-bodies';

export const DEFAULT_FROM_NAME = '{sitename}';

export interface CustomEmailTemplate {
  subject: string;
  fromName: string | null;
  bodyHtml: string;
}

export async function isEmailTemplateActive(templateKey: string): Promise<boolean> {
  try {
    const row = await db.emailTemplate.findUnique({
      where: { templateKey },
      select: { isActive: true },
    });
    if (row) return row.isActive;
    return !!getPredefinedTemplateBody(templateKey);
  } catch (e) {
    return !!getPredefinedTemplateBody(templateKey);
  }
}

export async function getCustomEmailTemplate(
  templateKey: string
): Promise<CustomEmailTemplate | null> {
  try {
    const row = await db.emailTemplate.findUnique({
      where: { templateKey },
    });
    if (row && row.isActive && row.subject && row.bodyHtml) {
      return {
        subject: row.subject,
        fromName: row.fromName?.trim() ? row.fromName : DEFAULT_FROM_NAME,
        bodyHtml: row.bodyHtml,
      };
    }
    const predefined = getPredefinedTemplateBody(templateKey);
    if (predefined) {
      return {
        subject: predefined.subject,
        fromName: predefined.fromName?.trim() ? predefined.fromName : DEFAULT_FROM_NAME,
        bodyHtml: predefined.bodyHtml,
      };
    }
    return null;
  } catch (e) {
    console.warn('getCustomEmailTemplate failed for', templateKey, e);
    const predefined = getPredefinedTemplateBody(templateKey);
    if (predefined) {
      return {
        subject: predefined.subject,
        fromName: predefined.fromName?.trim() ? predefined.fromName : DEFAULT_FROM_NAME,
        bodyHtml: predefined.bodyHtml,
      };
    }
    return null;
  }
}
