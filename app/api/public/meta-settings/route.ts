import { db } from '@/lib/db';
import { getAppName } from '@/lib/utils/general-settings';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [settings, appName] = await Promise.all([
      db.generalSettings.findFirst({
        select: {
          googleTitle: true,
          metaSiteTitle: true,
          siteDescription: true,
          metaKeywords: true,
          thumbnail: true,
        },
      }),
      getAppName()
    ]);

    const defaultMetaSettings = {
      googleTitle: `${appName} - Best Social Media Marketing Services`,
      siteTitle: appName,
      siteDescription: 'Get the best social media marketing services with fast delivery and affordable prices. Boost your social media presence today!',
      keywords: 'smm panel, social media marketing, instagram followers, youtube views, facebook likes',
      thumbnail: '',
    };

    const googleTitle = settings?.googleTitle?.trim() || '';
    const siteTitle = appName || defaultMetaSettings.siteTitle;
    const title = googleTitle || siteTitle;

    const siteDescriptionValue = settings?.siteDescription?.trim() || '';
    const siteDescription = siteDescriptionValue === '' ? defaultMetaSettings.siteDescription : siteDescriptionValue;

    const keywordsValue = settings?.metaKeywords?.trim() || '';
    const keywords = keywordsValue === '' ? defaultMetaSettings.keywords : keywordsValue;

    return NextResponse.json({
      success: true,
      metaSettings: {
        googleTitle,
        siteTitle,
        title,
        siteDescription,
        keywords,
        thumbnail: settings?.thumbnail || defaultMetaSettings.thumbnail,
      },
    });
  } catch (error) {
    console.error('Error fetching public meta settings:', error);
    const fallbackAppName = process.env.NEXT_PUBLIC_APP_NAME || 'App Name';
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        metaSettings: {
          googleTitle: `${fallbackAppName} - Best Social Media Marketing Services`,
          siteTitle: fallbackAppName,
          title: fallbackAppName,
          siteDescription: 'Get the best social media marketing services with fast delivery and affordable prices. Boost your social media presence today!',
          keywords: 'smm panel, social media marketing, instagram followers, youtube views, facebook likes',
          thumbnail: '',
        },
      },
      { status: 500 }
    );
  }
}
