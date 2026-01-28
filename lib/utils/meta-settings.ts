import { db } from '@/lib/db';

export interface MetaSettings {
  googleTitle: string;
  siteTitle: string;
  siteDescription: string;
  keywords: string;
  thumbnail: string;
}

let cachedMetaSettings: MetaSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

const DEFAULT_META_SETTINGS: MetaSettings = {
  googleTitle: '',
  siteTitle: 'SMM Panel',
  siteDescription: 'Discover the cheapest SMM panel in Bangladesh - a cost-effective solution for amazing business growth. Save money, gain new followers, and easily boost your online presence',
  keywords: 'SMM Panel, Cheapest SMM Panel, SMM Panel Bangladesh, Social Media Marketing, Facebook likes, Instagram followers, YouTube views',
  thumbnail: '/general/og-image.jpg'
};

export async function getMetaSettings(): Promise<MetaSettings> {
  const now = Date.now();

  if (cachedMetaSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedMetaSettings;
  }

  try {

    const settings = await db.generalSettings.findFirst();

    if (settings) {
      const googleTitle = settings.googleTitle?.trim() || '';
      const siteTitle = settings.siteTitle?.trim() || DEFAULT_META_SETTINGS.siteTitle;

      const siteDescriptionValue = settings.siteDescription?.trim() || '';
      const siteDescription = siteDescriptionValue === '' ? DEFAULT_META_SETTINGS.siteDescription : siteDescriptionValue;

      const keywordsValue = settings.metaKeywords?.trim() || '';
      const keywords = keywordsValue === '' ? DEFAULT_META_SETTINGS.keywords : keywordsValue;

      const metaSettings: MetaSettings = {
        googleTitle,
        siteTitle,
        siteDescription,
        keywords,
        thumbnail: settings.thumbnail || DEFAULT_META_SETTINGS.thumbnail
      };

      cachedMetaSettings = metaSettings;
      lastFetchTime = now;

      return metaSettings;
    }
  } catch (error) {
    console.error('Error fetching meta settings:', error);
  }

  return DEFAULT_META_SETTINGS;
}

export function clearMetaSettingsCache(): void {
  cachedMetaSettings = null;
  lastFetchTime = 0;
}

export function formatKeywords(keywords: string): string[] {
  if (!keywords) return [];
  return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
}

/** SEO title when set, otherwise Site Title. Use for document title and OG/twitter title. */
export function getDisplayTitle(meta: MetaSettings): string {
  return meta.googleTitle || meta.siteTitle;
}

export function getOpenGraphImageUrl(thumbnail: string, baseUrl: string): string {
  if (!thumbnail) return `${baseUrl}/og-image.jpg`;

  if (thumbnail.startsWith('http')) return thumbnail;

  if (thumbnail.startsWith('/')) return `${baseUrl}${thumbnail}`;

  return `${baseUrl}/general/${thumbnail}`;
}