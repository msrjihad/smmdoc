'use client';

import { useEffect, useState } from 'react';
import OfflineBanner from './offline-banner';

export default function OfflineDetector({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const checkInternetConnectivity = async (): Promise<boolean> => {
    try {
      setIsCheckingConnection(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
          mode: 'no-cors',
        });
        clearTimeout(timeoutId);
        return true;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            return navigator.onLine;
          }
          return false;
        }
        return false;
      }
    } catch (error) {
      return navigator.onLine;
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleRetryConnection = async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    const actuallyOnline = await checkInternetConnectivity();
    setIsOnline(actuallyOnline);
  };

  const handleOnlineStatusChange = () => {
    const browserOnline = navigator.onLine;

    if (!browserOnline) {
      setIsOnline(false);
      return;
    }

    checkInternetConnectivity().then(setIsOnline);
  };

  useEffect(() => {
    const browserOnline = navigator.onLine;
    
    if (!browserOnline) {
      setIsOnline(false);
    } else {
      checkInternetConnectivity().then(setIsOnline);
    }

    const handleOnline = () => handleOnlineStatusChange();
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connectivityInterval = setInterval(async () => {
      if (navigator.onLine) {
        const actuallyOnline = await checkInternetConnectivity();
        setIsOnline(actuallyOnline);
      } else {
        setIsOnline(false);
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityInterval);
    };
  }, []);

  return (
    <div>
      <OfflineBanner 
        isOnline={isOnline} 
        onRetry={handleRetryConnection}
        isRetrying={isCheckingConnection}
      />
      {children}
    </div>
  );
}