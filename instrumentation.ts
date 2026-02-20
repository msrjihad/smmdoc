import cron from 'node-cron';

let cronStarted = false;

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  if (cronStarted) {
    return;
  }

  cronStarted = true;

  cron.schedule('*/5 * * * *', async () => {
    try {
      const { runProviderSync } = await import('@/lib/utils/provider-sync');
      await runProviderSync({
        syncAll: true,
        broadcast: false,
        action: 'cron_sync'
      });
    } catch (error) {
      console.error('[Provider Cron] Sync failed:', error);
    }
  });

  cron.schedule('0 0 * * *', async () => {
    try {
      const { refreshHomepageStatsCache } = await import('@/lib/homepage-stats-cache');
      await refreshHomepageStatsCache();
    } catch (error) {
      console.error('[Homepage Stats Cron] Refresh failed:', error);
    }
  });

  console.log('[Provider Cron] Scheduled to run every 5 minutes');
  console.log('[Homepage Stats Cron] Scheduled to run every 24 hours (midnight)');
}
