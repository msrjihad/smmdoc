'use client';

import { useState, useEffect } from 'react';

interface UserSettings {
  resetPasswordEnabled: boolean;
  signUpPageEnabled: boolean;
  nameFieldEnabled: boolean;
  emailConfirmationEnabled: boolean;
  resetLinkMax: number;
  minimumFundsToAddUSD: number;
  maximumFundsToAddUSD: number;
  transferFundsPercentage: number;
  userFreeBalanceEnabled: boolean;
  freeAmount: number;
  paymentBonusEnabled: boolean;
  bonusPercentage: number;
}

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/public/user-settings');

      if (!response.ok) {
        throw new Error('Failed to fetch user settings');
      }

      const data = await response.json();

      if (data.success) {
        setSettings(data.userSettings);
      } else {
        throw new Error(data.error || 'Failed to load user settings');
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      setSettings({
        resetPasswordEnabled: true,
        signUpPageEnabled: true,
        nameFieldEnabled: true,
        emailConfirmationEnabled: true,
        resetLinkMax: 3,
        minimumFundsToAddUSD: 10,
        maximumFundsToAddUSD: 10000,
        transferFundsPercentage: 3,
        userFreeBalanceEnabled: false,
        freeAmount: 0,
        paymentBonusEnabled: false,
        bonusPercentage: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
  };
}
