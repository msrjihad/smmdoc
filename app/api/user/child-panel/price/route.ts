import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const moduleSettings = await db.moduleSettings.findFirst();
    const childPanelPrice = moduleSettings?.childPanelPrice ?? 10;

    return NextResponse.json({
      success: true,
      price: childPanelPrice
    });
  } catch (error) {
    console.error('Error fetching child panel price:', error);
    return NextResponse.json({
      success: true,
      price: 10
    });
  }
}

