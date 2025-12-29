'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export default function DatabaseConnectionDetector({ children }: { children: React.ReactNode }) {
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean | null>(null);
  const toastShownRef = useRef(false);

  const checkDatabaseConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/test-db', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.log('Database connection check failed:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const performCheck = async () => {
      const connected = await checkDatabaseConnection();
      const wasConnected = isDatabaseConnected;
      setIsDatabaseConnected(connected);

      if (!connected && (wasConnected === true || (wasConnected === null && !toastShownRef.current))) {
        toast.error('Internal Server Error!');
        toastShownRef.current = true;
      } else if (connected && wasConnected === false) {
        toastShownRef.current = false;
      }
    };

    performCheck();

    const interval = setInterval(() => {
      performCheck();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [isDatabaseConnected, checkDatabaseConnection]);

  return <>{children}</>;
}

