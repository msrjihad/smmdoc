import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.moduleSettings.findFirst({
      select: {
        childPanelSellingEnabled: true
      }
    });

    const childPanelSellingEnabled = settings?.childPanelSellingEnabled ?? false;
    
    return NextResponse.json({
      success: true,
      childPanelSellingEnabled
    });
  } catch (error) {
    console.error('Error checking child panel system status:', error);
    return NextResponse.json({
      success: true,
      childPanelSellingEnabled: false
    });
  }
}

