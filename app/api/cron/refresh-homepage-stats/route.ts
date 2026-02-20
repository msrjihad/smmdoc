import { NextRequest, NextResponse } from 'next/server';
import { refreshHomepageStatsCache } from '@/lib/homepage-stats-cache';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await refreshHomepageStatsCache();
    return NextResponse.json(
      { success: true, message: 'Homepage stats cache refreshed', data: stats },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error refreshing homepage stats:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to refresh homepage stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
