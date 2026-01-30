import { db } from '@/lib/db';

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
    return row ? row.isActive : false;
  } catch (e) {
    return false;
  }
}

export async function getCustomEmailTemplate(
  templateKey: string
): Promise<CustomEmailTemplate | null> {
  try {
    const integrationSettings = await db.integrationSettings.findFirst({
      select: { emailNotificationsEnabled: true },
    });
    if (!integrationSettings?.emailNotificationsEnabled) return null;

    const row = await db.emailTemplate.findUnique({
      where: { templateKey },
    });
    if (!row || row.isActive === false) return null;
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
