'use client';

import { useEffect, useState } from 'react';

interface PushNotificationSettings {
  enabled: boolean;
  oneSignalCode: string;
  oneSignalAppId: string;
  visibility: 'all' | 'not-logged-in' | 'signed-in';
}

interface OneSignalInjectorProps {
  userId?: string | number | null;
  isAuthenticated?: boolean;
}

const OneSignalInjector = ({ userId: userIdProp, isAuthenticated = false }: OneSignalInjectorProps) => {
  const [pushSettings, setPushSettings] = useState<PushNotificationSettings | null>(null);
  const userId = userIdProp != null ? String(userIdProp) : null;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/public/push-notification-settings');
        const data = await response.json();
        if (data.success && data.pushNotificationSettings) {
          setPushSettings(data.pushNotificationSettings);
        }
      } catch (error) {
        console.error('Failed to fetch push notification settings:', error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!pushSettings || !pushSettings.enabled || !pushSettings.oneSignalCode?.trim()) {
      return;
    }

    const shouldShow = () => {
      if (pushSettings.visibility === 'all') return true;
      if (pushSettings.visibility === 'not-logged-in') return !isAuthenticated;
      if (pushSettings.visibility === 'signed-in') return isAuthenticated;
      return true;
    };

    if (!shouldShow()) return;

    const existingScript = document.getElementById('onesignal-init');
    if (existingScript?.parentNode) {
      existingScript.parentNode.removeChild(existingScript);
    }

    const container = document.createElement('div');
    container.innerHTML = pushSettings.oneSignalCode;

    const scripts = container.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      newScript.setAttribute('data-onesignal', 'injected');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.innerHTML = oldScript.innerHTML;
      document.head.appendChild(newScript);
    });

    const externalUserId = isAuthenticated && userId ? userId : null;
    if (externalUserId) {
      const loginScript = document.createElement('script');
      loginScript.setAttribute('data-onesignal', 'login');
      loginScript.innerHTML = `
        (function() {
          try {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(async function(OneSignal) {
              if (typeof OneSignal.login === 'function') {
                await OneSignal.login('${externalUserId.replace(/'/g, "\\'")}');
              }
            });
          } catch (e) { console.warn('OneSignal login error:', e); }
        })();
      `;
      document.head.appendChild(loginScript);
    }

    return () => {
      document.querySelectorAll('script[data-onesignal]').forEach((el) => {
        if (el?.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, [pushSettings, isAuthenticated, userId]);

  return null;
};

export default OneSignalInjector;
