import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.moduleSettings.findFirst({
      select: {
        massOrderEnabled: true
      }
    });

    const massOrderEnabled = settings?.massOrderEnabled ?? false;
    
    return NextResponse.json({
      success: true,
      massOrderEnabled
    });
  } catch (error) {
    console.error('Error checking mass order system status:', error);
    return NextResponse.json({
      success: true,
      massOrderEnabled: false
    });
  }
}

