import { db } from '@/lib/db';

export interface CustomEmailTemplate {
  subject: string;
  fromName: string | null;
  bodyHtml: string;
}

export async function getCustomEmailTemplate(
  templateKey: string
): Promise<CustomEmailTemplate | null> {
  try {
    const row = await db.emailTemplate.findUnique({
      where: { templateKey },
    });
    if (!row) return null;
    return {
      subject: row.subject,
      fromName: row.fromName,
      bodyHtml: row.bodyHtml,
    };
  } catch (e) {
    console.warn('getCustomEmailTemplate failed for', templateKey, e);
    return null;
  }
}
