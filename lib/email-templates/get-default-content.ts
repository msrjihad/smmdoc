import { db } from '@/lib/db';
import { getPredefinedTemplateBody } from './predefined-bodies';

export async function getDefaultContent(
  templateKey: string
): Promise<{ subject: string; html: string }> {
  try {
    const row = await db.emailTemplate.findUnique({
      where: { templateKey },
    });
    if (row && row.subject && row.bodyHtml) {
      return { subject: row.subject, html: row.bodyHtml };
    }
    const predefined = getPredefinedTemplateBody(templateKey);
    if (predefined) {
      return { subject: predefined.subject, html: predefined.bodyHtml };
    }
    return { subject: '', html: '' };
  } catch (e) {
    console.error('getDefaultContent error for', templateKey, e);
    const predefined = getPredefinedTemplateBody(templateKey);
    if (predefined) {
      return { subject: predefined.subject, html: predefined.bodyHtml };
    }
    return { subject: '', html: '' };
  }
}
