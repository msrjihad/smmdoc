import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { clearGeneralSettingsCache } from '@/lib/utils/general-settings';
import { NextRequest, NextResponse } from 'next/server';

const defaultGeneralSettings = {
  siteTitle: 'SMM Panel',
  tagline: 'Best SMM Services Provider',
  siteIcon: '',
  siteLogo: '',
  siteDarkLogo: '',
  maintenanceMode: 'inactive',
  adminEmail: 'admin@example.com',
  supportEmail: '',
  whatsappSupport: '',
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
          tagline: defaultGeneralSettings.tagline,
          siteIcon: '',
          siteLogo: '',
          siteDarkLogo: '',
          maintenanceMode: defaultGeneralSettings.maintenanceMode,
          adminEmail: defaultGeneralSettings.adminEmail,
          supportEmail: '',
          whatsappSupport: '',
          googleTitle: '',
          metaKeywords: '',
          metaSiteTitle: '',
          siteDescription: '',
          thumbnail: '',
        }
      });
    }

    const taglineValue = settings.tagline?.trim() || '';
    const tagline = taglineValue === '' ? defaultGeneralSettings.tagline : taglineValue;
    
    return NextResponse.json({
      success: true,
      generalSettings: {
        siteTitle: settings.siteTitle || '',
        tagline: tagline,
        siteIcon: settings.siteIcon || '',
        siteLogo: settings.siteLogo || '',
        siteDarkLogo: settings.siteDarkLogo || '',
        maintenanceMode: (settings as any).maintenanceMode || defaultGeneralSettings.maintenanceMode,
        adminEmail: settings.adminEmail || defaultGeneralSettings.adminEmail,
        supportEmail: settings.supportEmail || '',
        whatsappSupport: settings.whatsappSupport || '',
      }
    });

  } catch (error) {
    console.error('Error loading general settings:', error);
    return NextResponse.json(
      { error: 'Failed to load general settings' },
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

    const { generalSettings } = await request.json();

    if (!generalSettings) {
      return NextResponse.json(
        { error: 'General settings data is required' },
        { status: 400 }
      );
    }

    const siteTitle = generalSettings.siteTitle?.trim() || defaultGeneralSettings.siteTitle;

    if (!generalSettings.adminEmail?.trim()) {
      return NextResponse.json(
        { error: 'Admin email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(generalSettings.adminEmail.trim())) {
      return NextResponse.json(
        { error: 'Invalid admin email format' },
        { status: 400 }
      );
    }

    const existingSettings = await db.generalSettings.findFirst();
    
    const taglineValue = generalSettings.tagline?.trim() || '';
    const tagline = taglineValue === '' ? defaultGeneralSettings.tagline : taglineValue;
    
    const updateData: any = {
      siteTitle: siteTitle,
      tagline: tagline,
      siteIcon: generalSettings.siteIcon || '',
      siteLogo: generalSettings.siteLogo || '',
      siteDarkLogo: generalSettings.siteDarkLogo || '',
      maintenanceMode: generalSettings.maintenanceMode || defaultGeneralSettings.maintenanceMode,
      adminEmail: generalSettings.adminEmail.trim(),
      updatedAt: new Date()
    };

    if (generalSettings.supportEmail !== undefined) {
      updateData.supportEmail = generalSettings.supportEmail?.trim() || '';
    }
    if (generalSettings.whatsappSupport !== undefined) {
      updateData.whatsappSupport = generalSettings.whatsappSupport?.trim() || '';
    }
    
    if (existingSettings) {
      await db.generalSettings.update({
        where: { id: existingSettings.id },
        data: updateData
      });
    } else {
      const createData: any = {
        ...updateData,
        maintenanceMode: generalSettings.maintenanceMode || defaultGeneralSettings.maintenanceMode,
        googleTitle: '',
        metaKeywords: '',
        metaSiteTitle: '',
        siteDescription: '',
        thumbnail: '',
      };
      
      if (generalSettings.supportEmail !== undefined) {
        createData.supportEmail = generalSettings.supportEmail?.trim() || '';
      }
      if (generalSettings.whatsappSupport !== undefined) {
        createData.whatsappSupport = generalSettings.whatsappSupport?.trim() || '';
      }
      
      await db.generalSettings.create({
        data: createData
      });
    }

    clearGeneralSettingsCache();
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: 'General settings saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving general settings:', error);
    const errorMessage = error?.message || 'Failed to save general settings';
    console.error('Detailed error:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        error: 'Failed to save general settings',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

