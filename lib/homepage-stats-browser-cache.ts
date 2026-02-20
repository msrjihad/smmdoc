export interface HomepageStatsData {
  completedOrders: number;
  activeServices: number;
  activeUsers: number;
  activeAffiliateUsers: number;
  totalUsers: number;
  totalOrders: number;
}

const STORAGE_KEY = 'homepage-stats-cache';
const TTL_MS = 24 * 60 * 60 * 1000;

function isStatsData(value: unknown): value is { data: HomepageStatsData; expiresAt: number } {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (typeof o.expiresAt !== 'number') return false;
  const d = o.data;
  if (!d || typeof d !== 'object') return false;
  const data = d as Record<string, unknown>;
  return (
    typeof data.completedOrders === 'number' &&
    typeof data.activeServices === 'number' &&
    typeof data.activeUsers === 'number' &&
    typeof data.activeAffiliateUsers === 'number' &&
    typeof data.totalUsers === 'number' &&
    typeof data.totalOrders === 'number'
  );
}

export function getCachedHomepageStatsFromBrowser(): HomepageStatsData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isStatsData(parsed)) return null;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function setHomepageStatsInBrowser(data: HomepageStatsData): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      data,
      expiresAt: Date.now() + TTL_MS,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
  }
}
