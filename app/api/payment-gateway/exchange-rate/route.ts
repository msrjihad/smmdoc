import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await db.paymentGatewaySettings.findFirst();
    
    const exchangeRate = settings?.exchangeRate ?? 120.00;

    return NextResponse.json({
      success: true,
      exchangeRate: exchangeRate,
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json(
      { 
        success: true,
        exchangeRate: 120.00
      },
      { status: 200 }
    );
  }
}

