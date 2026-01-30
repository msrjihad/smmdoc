import { db } from '@/lib/db';

const ACTIVITY_LOGS_MAX = 100;

/**
 * Keeps only the last 100 activity logs in the database.
 * Older logs beyond the 100 most recent are deleted automatically.
 */
export async function trimActivityLogsToMax(): Promise<number> {
  const count = await db.activityLogs.count();

  if (count <= ACTIVITY_LOGS_MAX) {
    return 0;
  }

  const olderIds = await db.activityLogs.findMany({
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    skip: ACTIVITY_LOGS_MAX,
  });

  if (olderIds.length === 0) {
    return 0;
  }

  const result = await db.activityLogs.deleteMany({
    where: { id: { in: olderIds.map((log) => log.id) } },
  });

  return result.count;
}
