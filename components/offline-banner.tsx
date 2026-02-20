'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaExclamationTriangle, FaSync, FaTimes, FaCheckCircle } from 'react-icons/fa';

interface OfflineBannerProps {
  isOnline: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export default function OfflineBanner({ isOnline, onRetry, isRetrying = false }: OfflineBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const wasOfflineRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      setShowOnlineMessage(true);
      setIsDismissed(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setShowOnlineMessage(false);
        setIsDismissed(true);
      }, 3000);
    } else if (!isOnline) {
      wasOfflineRef.current = true;
      setShowOnlineMessage(false);
      setIsDismissed(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOnline]);

  if (isDismissed || (isOnline && !showOnlineMessage)) return null;

  const isOnlineMode = showOnlineMessage && isOnline;
  const bgColor = isOnlineMode ? 'bg-green-600' : 'bg-red-600';
  const borderColor = isOnlineMode ? 'border-green-700' : 'border-red-700';
  const Icon = isOnlineMode ? FaCheckCircle : FaExclamationTriangle;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${bgColor} text-white shadow-md border-b ${borderColor} transition-colors duration-300`}>
      <div className="w-full relative">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 pr-12">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Icon className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">
                {isOnlineMode ? 'You\'re back online' : 'You\'re currently offline'}
              </p>
              <p className="text-xs opacity-90 leading-tight mt-0.5">
                {isOnlineMode 
                  ? 'Your internet connection has been restored.' 
                  : 'Some features may not be available. Check your internet connection.'}
              </p>
            </div>
          </div>

          {!isOnlineMode && (
            <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <FaSync className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Checking...' : 'Retry'}</span>
                </button>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setIsDismissed(true);
            setShowOnlineMessage(false);
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
          }}
          className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded transition-colors ${
            isOnlineMode 
              ? 'hover:bg-green-700' 
              : 'hover:bg-red-700'
          }`}
          aria-label={isOnlineMode ? 'Close online banner' : 'Close offline banner'}
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}