import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await db.generalSettings.findFirst({
      select: {
        siteIcon: true,
        siteLogo: true,
        siteDarkLogo: true,
        supportEmail: true,
        whatsappSupport: true,
        maintenanceMode: true,
      },
    });

    return NextResponse.json({
      success: true,
      generalSettings: {
        siteIcon: settings?.siteIcon || '',
        siteLogo: settings?.siteLogo || '',
        siteDarkLogo: settings?.siteDarkLogo || '',
        supportEmail: settings?.supportEmail || '',
        whatsappNumber: settings?.whatsappSupport || '',
        maintenanceMode: (settings as any)?.maintenanceMode || 'inactive',
      },
    });
  } catch (error) {
    console.error('Error fetching public general settings:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        generalSettings: {
          siteIcon: '',
          siteLogo: '',
          siteDarkLogo: '',
          supportEmail: '',
          whatsappNumber: '',
        },
      },
      { status: 500 }
    );
  }
}

