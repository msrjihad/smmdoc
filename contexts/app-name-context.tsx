'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

let globalSetAppName: ((name: string) => void) | null = null;

export function updateGlobalAppName(newAppName: string) {
  if (globalSetAppName) {
    globalSetAppName(newAppName);
  }
}

interface AppNameContextType {
  appName: string;
  setAppName: (name: string) => void;
}

const AppNameContext = createContext<AppNameContextType | undefined>(undefined);

export function AppNameProvider({ 
  children, 
  initialAppName 
}: { 
  children: React.ReactNode;
  initialAppName: string;
}) {
  const [appName, setAppName] = useState(initialAppName);

  useEffect(() => {
    globalSetAppName = setAppName;
    return () => {
      globalSetAppName = null;
    };
  }, [setAppName]);

  return (
    <AppNameContext.Provider value={{ appName, setAppName }}>
      {children}
    </AppNameContext.Provider>
  );
}

export function useAppName() {
  const context = useContext(AppNameContext);
  if (context === undefined) {
    throw new Error('useAppName must be used within an AppNameProvider');
  }
  return context;
}

export function useAppNameWithFallback() {
  const context = useContext(AppNameContext);
  if (context === undefined) {

    return {
      appName: process.env.NEXT_PUBLIC_APP_NAME || '',
      setAppName: () => {}
    };
  }
  return context;
}