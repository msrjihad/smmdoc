import cron from 'node-cron';

let cronStarted = false;

export async function register() {
  // Only run cron in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  // Avoid multiple cron schedules (e.g. hot reload in dev)
  if (cronStarted) {
    return;
  }

  cronStarted = true;

  // Run provider sync every 5 minutes
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

  console.log('[Provider Cron] Scheduled to run every 5 minutes');
}
