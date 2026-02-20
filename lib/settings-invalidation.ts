'use client';

export const SETTINGS_INVALIDATED_EVENT = 'settings-invalidated';

export type SettingsScope =
  | 'general'
  | 'meta'
  | 'currency'
  | 'custom-codes'
  | 'integrations'
  | 'payment-gateway'
  | 'user-settings'
  | 'email'
  | 'contact'
  | 'module'
  | 'ticket'
  | 'notification'
  | 'providers'
  | 'all';

export function dispatchSettingsInvalidated(scope: SettingsScope = 'all'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<{ scope: SettingsScope }>(SETTINGS_INVALIDATED_EVENT, {
      detail: { scope },
    })
  );
}
