import { db } from '@/lib/db';

const NOTIFICATIONS_MAX_PER_USER = 100;

/**
 * Keeps only the last 100 notifications per user.
 * Older notifications beyond the 100 most recent are deleted automatically.
 */
export async function trimNotificationsToMax(userId: number): Promise<number> {
  const count = await db.notifications.count({
    where: { userId },
  });

  if (count <= NOTIFICATIONS_MAX_PER_USER) {
    return 0;
  }

  const olderIds = await db.notifications.findMany({
    where: { userId },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    skip: NOTIFICATIONS_MAX_PER_USER,
  });

  if (olderIds.length === 0) {
    return 0;
  }

  const result = await db.notifications.deleteMany({
    where: { id: { in: olderIds.map((n) => n.id) } },
  });

  return result.count;
}
