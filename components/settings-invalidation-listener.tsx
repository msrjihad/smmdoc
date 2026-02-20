'use client';

import { useEffect } from 'react';
import { SETTINGS_INVALIDATED_EVENT } from '@/lib/settings-invalidation';
import type { SettingsScope } from '@/lib/settings-invalidation';
import { clearCachePattern } from '@/lib/utils/api-cache';

const GENERAL_SCOPES: SettingsScope[] = ['general', 'meta', 'all'];

const INTEGRATION_SCOPES: SettingsScope[] = ['integrations', 'all'];

const CURRENCY_SCOPES: SettingsScope[] = ['currency', 'all'];

const CUSTOM_CODES_SCOPES: SettingsScope[] = ['custom-codes', 'all'];

const USER_SETTINGS_SCOPES: SettingsScope[] = ['user-settings', 'all'];

const PAYMENT_SCOPES: SettingsScope[] = ['payment-gateway', 'all'];

function matchesScope(scope: SettingsScope, check: SettingsScope[]): boolean {
  return check.includes(scope);
}

export function SettingsInvalidationListener() {
  useEffect(() => {
    const handleInvalidation = (e: Event) => {
      const customEvent = e as CustomEvent<{ scope: SettingsScope }>;
      const scope = customEvent.detail?.scope ?? 'all';

      if (matchesScope(scope, GENERAL_SCOPES)) {
        clearCachePattern(/general-settings|public\/general/);
      }
      if (matchesScope(scope, INTEGRATION_SCOPES)) {
        clearCachePattern(/integration|live-chat/);
      }
      if (matchesScope(scope, CURRENCY_SCOPES)) {
        clearCachePattern(/currencies|currency/);
        try {
          const { clearCurrencyCache } = require('@/lib/currency-utils');
          clearCurrencyCache();
        } catch {
        }
      }
      if (matchesScope(scope, CUSTOM_CODES_SCOPES)) {
        clearCachePattern(/custom-codes/);
        window.dispatchEvent(new CustomEvent('customCodesUpdated'));
      }
      if (matchesScope(scope, USER_SETTINGS_SCOPES)) {
        clearCachePattern(/user-settings/);
      }
      if (matchesScope(scope, PAYMENT_SCOPES)) {
        clearCachePattern(/payment-gateway|payment/);
      }
    };

    window.addEventListener(SETTINGS_INVALIDATED_EVENT, handleInvalidation);
    return () => {
      window.removeEventListener(SETTINGS_INVALIDATED_EVENT, handleInvalidation);
    };
  }, []);

  return null;
}
