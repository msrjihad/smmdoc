'use client';
import * as React from 'react';
import { SWRConfig } from 'swr';
import { logger } from '@/lib/utils/logger';

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SWRConfig
      value={{

        dedupingInterval: 2000,


        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        revalidateIfStale: true,


        shouldRetryOnError: (error) => {

          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return true;
        },
        errorRetryCount: 3,
        errorRetryInterval: 1000,


        keepPreviousData: true,


        onError: (error, key) => {
          logger.error('SWR Error', error, { key });
        },


        fetcher: async (url: string) => {
          try {
            const response = await fetch(url, {
              credentials: 'include',
              cache: 'no-store',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
              (error as any).status = response.status;
              throw error;
            }

            return response.json();
          } catch (error) {
            logger.apiError('FETCH', url, error);
            throw error;
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
