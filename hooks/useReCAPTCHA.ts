'use client';

import { useState, useEffect } from 'react';

interface ReCAPTCHASettings {
  enabled: boolean;
  version: 'v2' | 'v3';
  siteKey: string;
  secretKey: string;
  threshold: number;
  enabledForms: {
    signUp: boolean;
    signIn: boolean;
    contact: boolean;
    supportTicket: boolean;
    contactSupport: boolean;
  };
}

interface UseReCAPTCHAReturn {
  recaptchaSettings: ReCAPTCHASettings | null;
  isLoading: boolean;
  error: string | null;
  isEnabledForForm: (formType: keyof ReCAPTCHASettings['enabledForms']) => boolean;
}

const useReCAPTCHA = (): UseReCAPTCHAReturn => {
  const [recaptchaSettings, setRecaptchaSettings] = useState<ReCAPTCHASettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReCAPTCHASettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/public/recaptcha-settings');

        if (!response.ok) {
          throw new Error('Failed to fetch integration settings');
        }

        const data = await response.json();

        if (data.success && data.recaptchaSettings) {
          const settings = data.recaptchaSettings;

          const recaptchaConfig: ReCAPTCHASettings = {
            enabled: settings.enabled || false,
            version: settings.version || 'v3',
            siteKey: settings.siteKey || '',
            secretKey: '',
            threshold: settings.threshold || 0.5,
            enabledForms: {
              signUp: settings.enabledForms?.signUp || false,
              signIn: settings.enabledForms?.signIn || false,
              contact: settings.enabledForms?.contact || false,
              supportTicket: settings.enabledForms?.supportTicket || false,
              contactSupport: settings.enabledForms?.contactSupport || false,
            },
          };

          setRecaptchaSettings(recaptchaConfig);
        }
      } catch (err) {
        console.error('Error fetching reCAPTCHA settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReCAPTCHASettings();
  }, []);

  const isEnabledForForm = (formType: keyof ReCAPTCHASettings['enabledForms']): boolean => {
    if (!recaptchaSettings || !recaptchaSettings.enabled) {
      return false;
    }
    return recaptchaSettings.enabledForms[formType] && !!recaptchaSettings.siteKey;
  };

  return {
    recaptchaSettings,
    isLoading,
    error,
    isEnabledForForm,
  };
};

export default useReCAPTCHA;
export type { ReCAPTCHASettings, UseReCAPTCHAReturn };