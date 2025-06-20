interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // Duration in milliseconds
}

class SmartCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Set cache with custom TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresIn = ttl || this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  /**
   * Get cached data if not expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const isExpired = Date.now() - item.timestamp > item.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiresIn) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiresIn) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }
}

// TTL Constants (Time To Live)
export const CACHE_TTL = {
  SEARCH_RESULTS: 10 * 60 * 1000,    // 10 minutes
  CHANNEL_DETAILS: 60 * 60 * 1000,   // 1 hour
  VIDEOS: 15 * 60 * 1000,             // 15 minutes
  USER_FAVORITES: 5 * 60 * 1000,      // 5 minutes
} as const;

// Cache instance
export const cache = new SmartCache();

// Cache key generators
export const cacheKeys = {
  searchResults: (query: string) => `search:${query.toLowerCase().trim()}`,
  channelDetails: (channelId: string) => `channel:${channelId}`,
  channelVideos: (channelId: string) => `videos:${channelId}`,
  userFavorites: (userId: string) => `favorites:${userId}`,
  latestVideos: (channelIds: string[]) => `latest:${channelIds.sort().join(',')}`,
} as const;

// Auto cleanup expired entries every 5 minutes
setInterval(() => {
  cache.clearExpired();
}, 5 * 60 * 1000); 