import { db } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

export interface HomepageStats {
  completedOrders: number;
  activeServices: number;
  activeUsers: number;
  activeAffiliateUsers: number;
  totalUsers: number;
  totalOrders: number;
}

async function computeStatsFromDb(): Promise<HomepageStats> {
  const [completedOrders, activeServices, activeUsers, activeAffiliateUsers, totalUsers, totalOrders] = await Promise.all([
    db.newOrders.count({ where: { status: 'completed' } }).catch((err) => {
      logger.error('Error counting completed orders', err);
      return 0;
    }),
    db.services.count({ where: { status: 'active', deletedAt: null } }).catch((err) => {
      logger.error('Error counting active services', err);
      return 0;
    }),
    db.users.count({ where: { role: 'user', status: 'active' } }).catch((err) => {
      logger.error('Error counting active users', err);
      return 0;
    }),
    db.affiliates.count({ where: { status: 'active' } }).catch((err) => {
      logger.error('Error counting active affiliate users', err);
      return 0;
    }),
    db.users.count().catch((err) => {
      logger.error('Error counting total users', err);
      return 0;
    }),
    db.newOrders.count().catch((err) => {
      logger.error('Error counting total orders', err);
      return 0;
    }),
  ]);

  return {
    completedOrders: completedOrders ?? 0,
    activeServices: activeServices ?? 0,
    activeUsers: activeUsers ?? 0,
    activeAffiliateUsers: activeAffiliateUsers ?? 0,
    totalUsers: totalUsers ?? 0,
    totalOrders: totalOrders ?? 0,
  };
}

export async function refreshHomepageStatsCache(): Promise<HomepageStats> {
  const stats = await computeStatsFromDb();
  logger.info('[HomepageStats] Refreshed (browser cache used on frontend)', { stats });
  return stats;
}

export async function getHomepageStats(): Promise<HomepageStats> {
  return computeStatsFromDb();
}
