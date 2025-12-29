import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbSettings = await db.integrationSettings.findFirst();
    
    if (!dbSettings || !dbSettings.analyticsEnabled) {
      return NextResponse.json({
        success: true,
        analyticsSettings: {
          enabled: false,
          googleAnalytics: {
            enabled: false,
            code: '',
            visibility: 'all',
          },
          facebookPixel: {
            enabled: false,
            code: '',
            visibility: 'all',
          },
          gtm: {
            enabled: false,
            code: '',
            visibility: 'all',
          },
        },
      });
    }

    const publicSettings = {
      enabled: dbSettings.analyticsEnabled,
      googleAnalytics: {
        enabled: dbSettings.googleAnalyticsEnabled,
        code: dbSettings.googleAnalyticsCode,
        visibility: dbSettings.googleAnalyticsVisibility,
      },
      facebookPixel: {
        enabled: dbSettings.facebookPixelEnabled,
        code: dbSettings.facebookPixelCode,
        visibility: dbSettings.facebookPixelVisibility,
      },
      gtm: {
        enabled: dbSettings.gtmEnabled,
        code: dbSettings.gtmCode,
        visibility: dbSettings.gtmVisibility,
      },
    };

    return NextResponse.json({
      success: true,
      analyticsSettings: publicSettings,
    });
  } catch (error) {
    console.error('Error fetching public analytics settings:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
