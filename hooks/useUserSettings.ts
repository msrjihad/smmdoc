'use client';
import { useEffect, useState } from 'react';

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

const defaultSettings: UserSettings = {
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
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/public/user-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.userSettings) {
            setSettings(data.userSettings);
          }
        } else {
          console.warn('Failed to fetch user settings, using defaults');
        }
      } catch (err) {
        console.error('Error fetching user settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
