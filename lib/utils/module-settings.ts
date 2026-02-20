import { db } from '@/lib/db';

interface ModuleSettings {
  affiliateSystemEnabled: boolean;
  commissionRate: number;
  minimumPayout: number;
  servicePurchaseEarningCount: string;
  childPanelSellingEnabled: boolean;
  childPanelPrice: number;
  serviceUpdateLogsEnabled: boolean;
  massOrderEnabled: boolean;
  servicesListPublic: boolean;
}

const DEFAULT_MODULE_SETTINGS: ModuleSettings = {
  affiliateSystemEnabled: false,
  commissionRate: 5,
  minimumPayout: 10,
  servicePurchaseEarningCount: '1',
  childPanelSellingEnabled: false,
  childPanelPrice: 10,
  serviceUpdateLogsEnabled: true,
  massOrderEnabled: false,
  servicesListPublic: true,
};

let cachedModuleSettings: ModuleSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getModuleSettings(bypassCache = false): Promise<ModuleSettings> {
  const now = Date.now();

  if (!bypassCache && cachedModuleSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedModuleSettings;
  }

  try {
    const settings = await db.moduleSettings.findFirst();
    if (settings) {
      cachedModuleSettings = {
        affiliateSystemEnabled: settings.affiliateSystemEnabled ?? DEFAULT_MODULE_SETTINGS.affiliateSystemEnabled,
        commissionRate: settings.commissionRate ?? DEFAULT_MODULE_SETTINGS.commissionRate,
        minimumPayout: settings.minimumPayout ?? DEFAULT_MODULE_SETTINGS.minimumPayout,
        servicePurchaseEarningCount: settings.servicePurchaseEarningCount ?? '1',
        childPanelSellingEnabled: settings.childPanelSellingEnabled ?? DEFAULT_MODULE_SETTINGS.childPanelSellingEnabled,
        childPanelPrice: settings.childPanelPrice ?? DEFAULT_MODULE_SETTINGS.childPanelPrice,
        serviceUpdateLogsEnabled: settings.serviceUpdateLogsEnabled ?? DEFAULT_MODULE_SETTINGS.serviceUpdateLogsEnabled,
        massOrderEnabled: settings.massOrderEnabled ?? DEFAULT_MODULE_SETTINGS.massOrderEnabled,
        servicesListPublic: settings.servicesListPublic ?? DEFAULT_MODULE_SETTINGS.servicesListPublic,
      };
      lastFetchTime = now;
      return cachedModuleSettings;
    }
  } catch (error) {
    console.warn('Failed to fetch module settings from database:', error);
    throw error;
  }

  cachedModuleSettings = { ...DEFAULT_MODULE_SETTINGS };
  lastFetchTime = now;
  return cachedModuleSettings;
}

export function clearModuleSettingsCache(): void {
  cachedModuleSettings = null;
  lastFetchTime = 0;
}

