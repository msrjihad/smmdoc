import { getAppNameSync, getGeneralSettings } from '@/lib/utils/general-settings';

let isInitialized = false;

async function initializeSettings() {
  if (!isInitialized && typeof window === 'undefined') {
    try {
      await getGeneralSettings();
      isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize general settings:', error);
    }
  }
}

if (typeof window === 'undefined') {
  initializeSettings();
}

export const APP_NAME = getAppNameSync();
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION;
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
