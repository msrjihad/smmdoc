import { NextResponse } from 'next/server';
import { contactDB } from '@/lib/contact-db';

export async function GET() {
  try {
    const contactSettings = await contactDB.getContactSettings();
    const contactSystemEnabled = contactSettings?.contactSystemEnabled ?? true;
    
    return NextResponse.json({
      success: true,
      contactSystemEnabled
    });
  } catch (error) {
    console.error('Error checking contact system status:', error);
    return NextResponse.json({
      success: true,
      contactSystemEnabled: true
    });
  }
}
