import { db } from '@/lib/db';

const SYNC_LOGS_MAX = 100;

export async function trimSyncLogsToMax(): Promise<number> {
  const count = await db.services.count({
    where: {
      status: 'active',
      updateText: { not: null },
    },
  });

  if (count <= SYNC_LOGS_MAX) {
    return 0;
  }

  const olderIds = await db.services.findMany({
    where: { status: 'active', updateText: { not: null } },
    select: { id: true },
    orderBy: { updatedAt: 'desc' },
    skip: SYNC_LOGS_MAX,
  });

  if (olderIds.length === 0) {
    return 0;
  }

  const result = await db.services.updateMany({
    where: { id: { in: olderIds.map((s) => s.id) } },
    data: { updateText: null },
  });

  return result.count;
}
