'use client';

import { useEffect, useState } from 'react';
import OfflineBanner from './offline-banner';

export default function OfflineDetector({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const checkConnectivity = async (): Promise<boolean> => {
    try {
      setIsCheckingConnection(true);

      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000),
      });

      return response.ok;
    } catch (error) {
      console.log('Internet connectivity check failed:', error);
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleRetryConnection = async () => {
    const actuallyOnline = await checkConnectivity();
    setIsOnline(actuallyOnline);
  };

  const handleOnlineStatusChange = async () => {
    const browserOnline = navigator.onLine;

    if (browserOnline) {
      const actuallyOnline = await checkConnectivity();
      setIsOnline(actuallyOnline);
    } else {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    const initialCheck = async () => {
      if (navigator.onLine) {
        const actuallyOnline = await checkConnectivity();
        setIsOnline(actuallyOnline);
      } else {
        setIsOnline(false);
      }
    };

    initialCheck();

    const handleOnline = () => handleOnlineStatusChange();
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connectivityInterval = setInterval(async () => {
      if (navigator.onLine) {
        const actuallyOnline = await checkConnectivity();
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