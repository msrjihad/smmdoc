import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.moduleSettings.findFirst({
      select: {
        affiliateSystemEnabled: true
      }
    });

    const affiliateSystemEnabled = settings?.affiliateSystemEnabled ?? false;
    
    return NextResponse.json({
      success: true,
      affiliateSystemEnabled
    });
  } catch (error) {
    console.error('Error checking affiliate system status:', error);
    return NextResponse.json({
      success: true,
      affiliateSystemEnabled: false
    });
  }
}

