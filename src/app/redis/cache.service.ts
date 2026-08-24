import redis from './redis.client';
import { CACHE_TTL } from '../constants';

export class CacheService {
  /**
   * Get cached data by key
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set cached data with TTL (in seconds)
   */
  static async set(key: string, value: unknown, ttlSeconds = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Gracefully continue without breaking request if Redis is down
    }
  }

  /**
   * Delete a single cache key
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch {
      // Non-blocking
    }
  }

  /**
   * Delete keys matching a wildcard pattern (e.g. 'courses:*')
   */
  static async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Non-blocking
    }
  }

  /**
   * Cache-Aside Helper: Fetch from cache or compute and cache
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

export default CacheService;

