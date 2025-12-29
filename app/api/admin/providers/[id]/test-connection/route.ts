import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { testProviderConnection } from '@/lib/utils/provider-validator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const providerId = parseInt(id);
    
    if (isNaN(providerId)) {
      return NextResponse.json(
        { error: 'Invalid provider ID', success: false },
        { status: 400 }
      );
    }

    const connectionResult = await testProviderConnection(providerId);

    return NextResponse.json({
      success: connectionResult.success,
      connected: connectionResult.success,
      error: connectionResult.error || null
    });

  } catch (error) {
    console.error('Error testing provider connection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test provider connection', 
        success: false,
        connected: false
      },
      { status: 500 }
    );
  }
}
