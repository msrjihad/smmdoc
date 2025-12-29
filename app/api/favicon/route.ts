import { NextRequest, NextResponse } from 'next/server';
import { getGeneralSettings } from '@/lib/utils/general-settings';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { db } = await import('@/lib/db');
    const settings = await db.generalSettings.findFirst({
      select: {
        siteIcon: true,
      },
    });
    
    const siteIcon = settings?.siteIcon || '';
    
    if (siteIcon && siteIcon.trim() !== '') {
      const iconPathRelative = siteIcon.startsWith('/') 
        ? siteIcon.substring(1) 
        : siteIcon;
      
      const iconPath = path.join(process.cwd(), 'public', iconPathRelative);
      
      try {
        if (fs.existsSync(iconPath)) {
          const fileBuffer = fs.readFileSync(iconPath);
          const fileExtension = path.extname(siteIcon).toLowerCase();
          
          let contentType = 'image/x-icon';
          switch (fileExtension) {
            case '.png':
              contentType = 'image/png';
              break;
            case '.jpg':
            case '.jpeg':
              contentType = 'image/jpeg';
              break;
            case '.gif':
              contentType = 'image/gif';
              break;
            case '.svg':
              contentType = 'image/svg+xml';
              break;
            case '.ico':
              contentType = 'image/x-icon';
              break;
            default:
              contentType = 'image/png';
          }
          
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=300, s-maxage=300, must-revalidate',
            },
          });
        } else {
          console.warn(`[Favicon] File not found at: ${iconPath}. SiteIcon value: ${siteIcon}`);
          const dirPath = path.dirname(iconPath);
          if (fs.existsSync(dirPath)) {
            try {
              const files = fs.readdirSync(dirPath);
              console.log(`[Favicon] Files in directory ${dirPath}:`, files);
            } catch (e) {
            }
          }
        }
      } catch (fileError) {
        console.error(`Error reading favicon file at ${iconPath}:`, fileError);
      }
    }
    
    const defaultFaviconPath = path.join(process.cwd(), 'public', 'favicon.png');
    if (fs.existsSync(defaultFaviconPath)) {
      const fileBuffer = fs.readFileSync(defaultFaviconPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300, s-maxage=300, must-revalidate',
        },
      });
    }
    
    return new NextResponse('Favicon not found', { status: 404 });
    
  } catch (error) {
    console.error('Error serving favicon:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
