'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

export default function DatabaseConnectionDetector({ children }: { children: React.ReactNode }) {
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState(false);
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
        setShowToast(true);
        toastShownRef.current = true;
      } else if (connected && wasConnected === false) {
        setShowToast(false);
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

  return (
    <>
      {showToast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center space-x-2">
            <FaExclamationTriangle className="w-4 h-4" />
            <span className="font-medium">Internal Server Error!</span>
            <button 
              onClick={() => {
                setShowToast(false);
                toastShownRef.current = false;
              }} 
              className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

