/**
 * API Request Deduplication and Caching Utility
 * Prevents duplicate API calls and provides request caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private defaultTTL = 60000; // 1 minute default

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
    });
  }

  /**
   * Check if a request is already pending
   */
  getPendingRequest<T>(key: string): Promise<T> | null {
    const pending = this.pendingRequests.get(key);
    if (!pending) return null;

    // Clean up stale pending requests (older than 30 seconds)
    if (Date.now() - pending.timestamp > 30000) {
      this.pendingRequests.delete(key);
      return null;
    }

    return pending.promise;
  }

  /**
   * Set a pending request
   */
  setPendingRequest<T>(key: string, promise: Promise<T>): void {
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    // Clean up after promise resolves/rejects
    promise
      .finally(() => {
        // Keep it for a short time in case of rapid duplicate requests
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, 1000);
      });
  }

  /**
   * Clear cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Generate cache key from URL and options
   */
  generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Fetch with deduplication and caching
   */
  async fetch<T>(
    url: string,
    options?: RequestInit,
    ttl?: number
  ): Promise<T> {
    const key = this.generateKey(url, options);

    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if request is already pending
    const pending = this.getPendingRequest<T>(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const promise = fetch(url, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json() as Promise<T>;
      })
      .then((data) => {
        // Cache successful responses
        this.set(key, data, ttl);
        return data;
      })
      .catch((error) => {
        // Don't cache errors
        this.delete(key);
        throw error;
      });

    this.setPendingRequest(key, promise);
    return promise;
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

/**
 * Hook-friendly fetch wrapper with deduplication
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl?: number
): Promise<T> {
  return apiCache.fetch<T>(url, options, ttl);
}

/**
 * Clear cache for specific URL pattern
 */
export function clearCachePattern(pattern: string | RegExp): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  
  for (const key of apiCache['cache'].keys()) {
    if (regex.test(key)) {
      apiCache.delete(key);
    }
  }
}

