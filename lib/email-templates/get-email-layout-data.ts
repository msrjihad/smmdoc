

import type { EmailLayoutData } from './shared/email-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export async function getEmailLayoutDataFromSettings(overrides?: Partial<EmailLayoutData>): Promise<EmailLayoutData> {
  try {
    const { getGeneralSettings } = await import('@/lib/utils/general-settings');
    const settings = await getGeneralSettings();
    const siteLogo = settings.siteLogo || '';
    const logoUrl = siteLogo
      ? siteLogo.startsWith('http')
        ? siteLogo
        : `${APP_URL.replace(/\/$/, '')}${siteLogo.startsWith('/') ? '' : '/'}${siteLogo}`
      : '';
    return {
      title: settings.siteTitle || 'SMM Panel',
      siteName: settings.siteTitle || 'SMM Panel',
      tagline: settings.tagline || '',
      siteLogo: logoUrl,
      appUrl: APP_URL,
      primaryColor: '#5f1de8',
      secondaryColor: '#b131f8',
      ...overrides,
    };
  } catch (e) {
    console.warn('getEmailLayoutDataFromSettings failed', e);
    return {
      title: 'SMM Panel',
      siteName: 'SMM Panel',
      tagline: '',
      siteLogo: '',
      appUrl: APP_URL,
      primaryColor: '#5f1de8',
      secondaryColor: '#b131f8',
      ...overrides,
    };
  }
}
