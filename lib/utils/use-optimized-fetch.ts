/**
 * Optimized fetch hook with deduplication and caching
 * Prevents duplicate API calls and provides automatic caching
 */

import { useCallback, useRef } from 'react';
import { cachedFetch } from './api-cache';
import { logger } from './logger';

interface UseOptimizedFetchOptions {
  ttl?: number; // Time to live in milliseconds
  skipCache?: boolean; // Skip cache for this request
}

/**
 * Hook for optimized fetch with automatic deduplication
 */
export function useOptimizedFetch() {
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const fetch = useCallback(
    async <T = any>(
      url: string,
      options?: RequestInit,
      fetchOptions?: UseOptimizedFetchOptions
    ): Promise<T> => {
      const { ttl = 60000, skipCache = false } = fetchOptions || {};

      // Create abort controller for this request
      const controller = new AbortController();
      const requestId = `${url}-${Date.now()}`;
      abortControllersRef.current.set(requestId, controller);

      try {
        // Use cached fetch if not skipping cache
        if (!skipCache) {
          return await cachedFetch<T>(url, {
            ...options,
            signal: controller.signal,
          }, ttl);
        }

        // Direct fetch if skipping cache
        const response = await globalThis.fetch(url, {
          ...options,
          signal: controller.signal,
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error: any) {
        if (error.name === 'AbortError') {
          logger.debug('Request aborted', { url });
          throw error;
        }
        logger.apiError('FETCH', url, error);
        throw error;
      } finally {
        abortControllersRef.current.delete(requestId);
      }
    },
    []
  );

  // Cleanup function to abort pending requests
  const abortAll = useCallback(() => {
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
  }, []);

  return { fetch, abortAll };
}

