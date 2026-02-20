
export interface GeneralSettings {
  siteTitle: string;
  tagline: string;
  siteDescription: string;
  siteIcon: string;
  siteLogo: string;
  siteDarkLogo: string;
  adminEmail: string;
  supportEmail: string;
  siteUrl: string;
  metaKeywords: string;
  metaSiteTitle: string;
  googleTitle: string;
  thumbnail: string;
  footerText: string;
}

let cachedSettings: GeneralSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

const MINIMAL_FALLBACK: GeneralSettings = {
  siteTitle: '',
  tagline: 'Best SMM Services Provider',
  siteDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Professional Social Media Marketing Panel',
  siteIcon: '/favicon.png',
  siteLogo: '/logo.png',
  siteDarkLogo: '',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  supportEmail: '',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || '',
  metaKeywords: 'SMM, Social Media Marketing, Panel',
  metaSiteTitle: '',
  googleTitle: '',
  thumbnail: '/general/og-image.jpg',
  footerText: '© 2025 SMM Panel. All rights reserved.'
};

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const now = Date.now();

  if (cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {

    if (typeof window !== 'undefined') {

      const [generalResponse, metaResponse] = await Promise.all([
        fetch('/api/admin/general-settings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/admin/meta-settings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]);

      let generalData = null;
      let metaData = null;

      if (generalResponse.ok) {
        const generalResult = await generalResponse.json();
        if (generalResult.success && generalResult.generalSettings) {
          generalData = generalResult.generalSettings;
        }
      }

      if (metaResponse.ok) {
        const metaResult = await metaResponse.json();
        if (metaResult.success && metaResult.metaSettings) {
          metaData = metaResult.metaSettings;
        }
      }

      if (generalData) {
        const taglineValue = generalData.tagline?.trim() || '';
        const tagline = taglineValue === '' ? MINIMAL_FALLBACK.tagline : taglineValue;
        
        const googleTitle = metaData?.googleTitle?.trim() || '';
        
        const siteDescriptionValue = metaData?.siteDescription?.trim() || '';
        const siteDescription = siteDescriptionValue === '' ? MINIMAL_FALLBACK.siteDescription : siteDescriptionValue;
        
        const metaKeywordsValue = metaData?.keywords?.trim() || '';
        const metaKeywords = metaKeywordsValue === '' ? MINIMAL_FALLBACK.metaKeywords : metaKeywordsValue;
        
        cachedSettings = {
          siteTitle: generalData.siteTitle || '',
          tagline: tagline,
          siteDescription: siteDescription,
          siteIcon: generalData.siteIcon || '',
          siteLogo: generalData.siteLogo || MINIMAL_FALLBACK.siteLogo,
          siteDarkLogo: generalData.siteDarkLogo || MINIMAL_FALLBACK.siteDarkLogo,
          adminEmail: generalData.adminEmail || MINIMAL_FALLBACK.adminEmail,
          supportEmail: generalData.supportEmail || '',
          siteUrl: MINIMAL_FALLBACK.siteUrl,
          metaKeywords: metaKeywords,
          metaSiteTitle: metaData?.siteTitle || generalData.siteTitle || '',
          googleTitle: googleTitle,
          thumbnail: metaData?.thumbnail || MINIMAL_FALLBACK.thumbnail,
          footerText: MINIMAL_FALLBACK.footerText
        };
        lastFetchTime = now;
        return cachedSettings;
      }
    } else {

      const { db } = await import('@/lib/db');

      const settings = await db.generalSettings.findFirst();
      if (settings) {
        const taglineValue = settings.tagline?.trim() || '';
        const tagline = taglineValue === '' ? MINIMAL_FALLBACK.tagline : taglineValue;
        
        const googleTitle = settings.googleTitle?.trim() || '';
        
        const siteDescriptionValue = settings.siteDescription?.trim() || '';
        const siteDescription = siteDescriptionValue === '' ? MINIMAL_FALLBACK.siteDescription : siteDescriptionValue;
        
        const metaKeywordsValue = settings.metaKeywords?.trim() || '';
        const metaKeywords = metaKeywordsValue === '' ? MINIMAL_FALLBACK.metaKeywords : metaKeywordsValue;
        
        cachedSettings = {
          siteTitle: settings.siteTitle || '',
          tagline: tagline,
          siteDescription: siteDescription,
          siteIcon: settings.siteIcon || '',
          siteLogo: settings.siteLogo || MINIMAL_FALLBACK.siteLogo,
          siteDarkLogo: settings.siteDarkLogo || MINIMAL_FALLBACK.siteDarkLogo,
          adminEmail: settings.adminEmail || MINIMAL_FALLBACK.adminEmail,
          supportEmail: settings.supportEmail || '',
          siteUrl: MINIMAL_FALLBACK.siteUrl,
          metaKeywords: metaKeywords,
          metaSiteTitle: settings.metaSiteTitle || settings.siteTitle || '',
          googleTitle: googleTitle,
          thumbnail: settings.thumbnail || MINIMAL_FALLBACK.thumbnail,
          footerText: MINIMAL_FALLBACK.footerText
        };
        lastFetchTime = now;
        return cachedSettings;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch general settings:', error);
  }

  cachedSettings = { ...MINIMAL_FALLBACK };
  lastFetchTime = now;
  return cachedSettings;
}

export async function getAppName(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.siteTitle;
}

export async function getSiteDescription(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.siteDescription;
}

export async function getAdminEmail(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.adminEmail;
}

export async function getTagline(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.tagline;
}

export async function getMetaSiteTitle(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.metaSiteTitle;
}

export async function getGoogleTitle(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.googleTitle;
}

export async function getThumbnail(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.thumbnail;
}

export async function getFooterText(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.footerText;
}

export async function getSiteLogo(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.siteLogo;
}

export async function getSiteIcon(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.siteIcon;
}

export async function getSupportEmail(): Promise<string> {
  const settings = await getGeneralSettings();
  return settings.supportEmail || '';
}

export async function getWhatsAppNumber(): Promise<string> {
  try {
    const { db } = await import('@/lib/db');
    const settings = await db.generalSettings.findFirst({
      select: { whatsappSupport: true }
    });
    return settings?.whatsappSupport || '';
  } catch (error) {
    console.error('Error fetching WhatsApp number:', error);
    return '';
  }
}

export function formatWhatsAppLink(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return '#';
  }
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  const numbersOnly = cleaned.replace(/^\+/, '');
  return `https://wa.me/${numbersOnly}`;
}

export function getGeneralSettingsSync(): GeneralSettings {
  return cachedSettings || { ...MINIMAL_FALLBACK };
}

export function getAppNameSync(): string {
  const settings = getGeneralSettingsSync();
  return settings.siteTitle;
}

export function getTaglineSync(): string {
  const settings = getGeneralSettingsSync();
  return settings.tagline;
}

export function getSiteDescriptionSync(): string {
  const settings = getGeneralSettingsSync();
  return settings.siteDescription;
}

export function getAdminEmailSync(): string {
  const settings = getGeneralSettingsSync();
  return settings.adminEmail;
}

export function getMetaSiteTitleSync(): string {
  const settings = getGeneralSettingsSync();
  return settings.metaSiteTitle;
}

export function getGoogleTitleSync(): string {
  const settings = getGeneralSettingsSync();
  return settings.googleTitle;
}

export function getThumbnailSync(): string {
  const settings = getGeneralSettingsSync();
  return settings.thumbnail;
}

export function getFooterTextSync(): string {
  const settings = getGeneralSettingsSync();
  return settings.footerText;
}

export function clearGeneralSettingsCache(): void {
  cachedSettings = null;
  lastFetchTime = 0;
}

export function clearAppNameCache(): void {
  clearGeneralSettingsCache();
}

export async function getMaintenanceMode(): Promise<'inactive' | 'active'> {
  try {
    const { db } = await import('@/lib/db');
    const settings = await db.generalSettings.findFirst({
      select: { maintenanceMode: true }
    });
    return (settings?.maintenanceMode as 'inactive' | 'active') || 'inactive';
  } catch (error) {
    console.warn('Failed to fetch maintenance mode:', error);
    return 'inactive';
  }
}

export {
  getAppName as getSiteTitle,
  getAppNameSync as getSiteTitleSync
};