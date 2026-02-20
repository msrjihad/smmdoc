import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.ticketSettings.findFirst({
      select: {
        ticketSystemEnabled: true
      }
    });

    const ticketSystemEnabled = settings?.ticketSystemEnabled ?? true;
    
    return NextResponse.json({
      success: true,
      ticketSystemEnabled
    });
  } catch (error) {
    console.error('Error checking ticket system status:', error);
    return NextResponse.json({
      success: true,
      ticketSystemEnabled: true
    });
  }
}
