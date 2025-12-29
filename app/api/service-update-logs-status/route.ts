import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.moduleSettings.findFirst({
      select: {
        serviceUpdateLogsEnabled: true
      }
    });

    const serviceUpdateLogsEnabled = settings?.serviceUpdateLogsEnabled ?? true;
    
    return NextResponse.json({
      success: true,
      serviceUpdateLogsEnabled
    });
  } catch (error) {
    console.error('Error checking service update logs status:', error);
    return NextResponse.json({
      success: true,
      serviceUpdateLogsEnabled: true
    });
  }
}

