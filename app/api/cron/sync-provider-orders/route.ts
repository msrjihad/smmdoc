import { NextRequest, NextResponse } from 'next/server';
import { runProviderSync } from '@/lib/utils/provider-sync';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting cron provider order sync...');

    const result = await runProviderSync({
      syncAll: true,
      broadcast: false,
      action: 'cron_sync'
    });

    return NextResponse.json(
      {
        success: true,
        message: `Synced ${result.syncedCount} provider orders`,
        data: {
          syncedCount: result.syncedCount,
          totalChecked: result.totalChecked,
          totalProcessed: result.totalProcessed,
          results: result.results
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in provider order sync:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync provider orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required', data: null },
        { status: 400 }
      );
    }

    const result = await runProviderSync({
      orderIds: [orderId],
      broadcast: false,
      action: 'cron_sync'
    });

    const syncResult = result.results[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Order synced successfully',
        data: syncResult ?? { orderId, updated: false, message: 'Order not found or not a provider order' }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in manual order sync:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync order',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
