import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { clearMetaSettingsCache } from '@/lib/utils/meta-settings';
import { NextRequest, NextResponse } from 'next/server';

const defaultMetaSettings = {
  googleTitle: '',
  siteTitle: '',
  siteDescription: 'Get the best social media marketing services with fast delivery and affordable prices. Boost your social media presence today!',
  keywords: 'smm panel, social media marketing, instagram followers, youtube views, facebook likes',
  thumbnail: '',
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await db.generalSettings.findFirst();
    if (!settings) {
      settings = await db.generalSettings.create({
        data: {
          siteTitle: '',
          tagline: 'Best SMM Services Provider',
          siteIcon: '',
          siteLogo: '',
          adminEmail: 'admin@example.com',
          googleTitle: '',
          metaSiteTitle: defaultMetaSettings.siteTitle,
          siteDescription: defaultMetaSettings.siteDescription,
          metaKeywords: defaultMetaSettings.keywords,
          thumbnail: defaultMetaSettings.thumbnail
        }
      });
    }

    const googleTitle = settings.googleTitle?.trim() || '';
    
    const siteDescriptionValue = settings.siteDescription?.trim() || '';
    const siteDescription = siteDescriptionValue === '' ? defaultMetaSettings.siteDescription : siteDescriptionValue;
    
    const keywordsValue = settings.metaKeywords?.trim() || '';
    const keywords = keywordsValue === '' ? defaultMetaSettings.keywords : keywordsValue;
    
    return NextResponse.json({
      success: true,
      metaSettings: {
        googleTitle: googleTitle,
        siteTitle: googleTitle,
        siteDescription: siteDescription,
        keywords: keywords,
        thumbnail: settings.thumbnail || '',
      }
    });

  } catch (error) {
    console.error('Error loading meta settings:', error);
    return NextResponse.json(
      { error: 'Failed to load meta settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { metaSettings } = await request.json();

    if (!metaSettings) {
      return NextResponse.json(
        { error: 'Meta settings data is required' },
        { status: 400 }
      );
    }

    if (!metaSettings.googleTitle?.trim()) {
      return NextResponse.json(
        { error: 'Google title is required' },
        { status: 400 }
      );
    }

    const googleTitleValue = metaSettings.googleTitle.trim();

    if (!metaSettings.siteDescription?.trim()) {
      return NextResponse.json(
        { error: 'Site description is required' },
        { status: 400 }
      );
    }

    if (metaSettings.siteDescription.length > 160) {
      return NextResponse.json(
        { error: 'Site description must be 160 characters or less' },
        { status: 400 }
      );
    }

    await db.generalSettings.upsert({
      where: { id: 1 },
      update: {
        googleTitle: googleTitleValue,
        metaSiteTitle: googleTitleValue,
        siteDescription: metaSettings.siteDescription.trim(),
        metaKeywords: metaSettings.keywords?.trim() || '',
        thumbnail: metaSettings.thumbnail || '',
        updatedAt: new Date()
      },
      create: {
        id: 1,
        siteTitle: '',
        tagline: 'Best SMM Services Provider',
        siteIcon: '',
        siteLogo: '',
        adminEmail: 'admin@example.com',
        googleTitle: googleTitleValue,
        metaSiteTitle: googleTitleValue,
        siteDescription: metaSettings.siteDescription.trim(),
        metaKeywords: metaSettings.keywords?.trim() || '',
        thumbnail: metaSettings.thumbnail || ''
      }
    });

    clearMetaSettingsCache();
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: 'Meta settings saved successfully'
    });

  } catch (error) {
    console.error('Error saving meta settings:', error);
    return NextResponse.json(
      { error: 'Failed to save meta settings' },
      { status: 500 }
    );
  }
}
