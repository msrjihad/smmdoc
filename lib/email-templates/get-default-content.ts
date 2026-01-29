

import { db } from '@/lib/db';

export async function getDefaultContent(
  templateKey: string
): Promise<{ subject: string; html: string }> {
  try {
    const row = await db.emailTemplate.findUnique({
      where: { templateKey },
    });
    if (!row) return { subject: '', html: '' };
    return { subject: row.subject, html: row.bodyHtml };
  } catch (e) {
    console.error('getDefaultContent error for', templateKey, e);
    return { subject: '', html: '' };
  }
}
