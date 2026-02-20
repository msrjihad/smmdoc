import { db } from '@/lib/db';

async function getOneSignalConfig() {
  const integrationSettings = await db.integrationSettings.findFirst();
  if (
    !integrationSettings?.pushNotificationsEnabled ||
    !integrationSettings?.oneSignalRestApiKey?.trim() ||
    !integrationSettings?.oneSignalAppId?.trim()
  ) {
    return null;
  }
  return {
    restApiKey: integrationSettings.oneSignalRestApiKey,
    appId: integrationSettings.oneSignalAppId,
  };
}

export async function sendOneSignalPush(
  userIds: number[],
  title: string,
  message: string,
  url?: string
): Promise<void> {
  try {
    const config = await getOneSignalConfig();
    if (!config) return;

    if (userIds.length === 0) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';
    const fullUrl = url && appUrl ? `${appUrl.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}` : undefined;

    const externalUserIds = userIds.map((id) => String(id));

    const body: Record<string, unknown> = {
      app_id: config.appId,
      include_external_user_ids: externalUserIds,
      contents: { en: message },
      headings: { en: title },
    };
    if (fullUrl) {
      body.url = fullUrl;
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(config.restApiKey + ':').toString('base64')}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[OneSignal] API error:', response.status, errText);
    }
  } catch (error) {
    console.error('[OneSignal] Failed to send push notification:', error);
  }
}
