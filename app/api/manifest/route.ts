import { NextRequest, NextResponse } from 'next/server';
import { getGeneralSettings } from '@/lib/utils/general-settings';
import { getAppName } from '@/lib/utils/general-settings';

export async function GET(request: NextRequest) {
  try {
    const [generalSettings, appName] = await Promise.all([
      getGeneralSettings(),
      getAppName()
    ]);

    const iconPath = generalSettings.siteIcon && generalSettings.siteIcon.trim() !== '' 
      ? generalSettings.siteIcon 
      : '';
    const siteUrl = generalSettings.siteUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://smmdoc.suitableit.com';

    const manifest = {
      id: '/',
      name: appName,
      short_name: appName,
      description: generalSettings.siteDescription || '',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      orientation: 'portrait-primary',
      categories: ['business', 'productivity', 'social'],
      icons: iconPath ? [
        {
          src: iconPath,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: iconPath,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ] : []
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating manifest:', error);
    
    const fallbackManifest = {
      id: '/',
      name: 'SMMDOC',
      short_name: 'SMMDOC',
      description: 'Your Social Media Growth Partner',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      orientation: 'portrait-primary',
      categories: ['business', 'productivity', 'social'],
      icons: [
        {
          src: '/favicon.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/favicon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    return NextResponse.json(fallbackManifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}

