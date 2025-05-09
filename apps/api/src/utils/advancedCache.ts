import { createServiceLogger } from "./logger";
import Redis from "ioredis";
import { config } from "../config";
import NodeCache from "node-cache";

const logger = createServiceLogger("advanced-cache");

// Multi-tiered caching system:
// 1. Memory cache (ultra-fast, but limited size)
// 2. Redis cache (fast, distributed, larger capacity)

// In-memory cache for extremely high-volume data
const memoryCache = new NodeCache({
  stdTTL: 60, // Default 60 seconds
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone objects for better performance
  maxKeys: 10000, // Limit memory usage
});

// Redis connection for distributed cache
const redisClient = new Redis(config.redis.url, {
  password: config.redis.password,
  keyPrefix: config.redis.keyPrefix,
  retryStrategy(times) {
    const delay = Math.min(Math.pow(2, times) * 50, 2000);
    return delay;
  },
});

redisClient.on("error", (err) => {
  logger.error("Redis cache client error:", { error: err.message });
});

// Cache key categories and TTLs
const CACHE_CATEGORIES = {
  HIGH_VOLUME: {
    prefix: "hv:",
    ttl: config.redis.highVolumeTTL,
    useMemoryCache: true,
  },
  STANDARD: {
    prefix: "std:",
    ttl: config.redis.defaultTTL,
    useMemoryCache: false,
  },
  LONG_TERM: {
    prefix: "lt:",
    ttl: config.redis.longTermTTL,
    useMemoryCache: false,
  },
};

/**
 * Get a value from cache with tiered fallback
 */
export async function getFromCache<T>(
  key: string,
  category: keyof typeof CACHE_CATEGORIES = "STANDARD"
): Promise<T | null> {
  const cacheConfig = CACHE_CATEGORIES[category];
  const fullKey = `${cacheConfig.prefix}${key}`;

  try {
    // Try memory cache first if enabled for this category
    if (cacheConfig.useMemoryCache) {
      const memValue = memoryCache.get<T>(fullKey);
      if (memValue !== undefined) {
        return memValue;
      }
    }

    // Try Redis cache next
    const redisValue = await redisClient.get(fullKey);
    if (!redisValue) return null;

    const parsedValue = JSON.parse(redisValue) as T;

    // Store in memory cache if enabled for this category
    if (cacheConfig.useMemoryCache) {
      memoryCache.set(fullKey, parsedValue, Math.min(cacheConfig.ttl, 60)); // Memory cache max 60s
    }

    return parsedValue;
  } catch (error) {
    logger.error(`Cache get error for key ${fullKey}:`, {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Set a value in the cache with tiered strategy
 */
export async function setInCache<T>(
  key: string,
  data: T,
  category: keyof typeof CACHE_CATEGORIES = "STANDARD",
  customTTL?: number
): Promise<boolean> {
  const cacheConfig = CACHE_CATEGORIES[category];
  const fullKey = `${cacheConfig.prefix}${key}`;
  const ttl = customTTL || cacheConfig.ttl;

  try {
    // Set in Redis
    await redisClient.set(fullKey, JSON.stringify(data), "EX", ttl);

    // Also set in memory if enabled for this category
    if (cacheConfig.useMemoryCache) {
      memoryCache.set(fullKey, data, Math.min(ttl, 60)); // Memory cache max 60s
    }

    return true;
  } catch (error) {
    logger.error(`Cache set error for key ${fullKey}:`, {
      error: (error as Error).message,
    });
    return false;
  }
}

/**
 * Delete a value from all cache tiers
 */
export async function deleteFromCache(
  key: string,
  category: keyof typeof CACHE_CATEGORIES = "STANDARD"
): Promise<boolean> {
  const cacheConfig = CACHE_CATEGORIES[category];
  const fullKey = `${cacheConfig.prefix}${key}`;

  try {
    // Delete from both tiers
    if (cacheConfig.useMemoryCache) {
      memoryCache.del(fullKey);
    }
    await redisClient.del(fullKey);
    return true;
  } catch (error) {
    logger.error(`Cache delete error for key ${fullKey}:`, {
      error: (error as Error).message,
    });
    return false;
  }
}

/**
 * Invalidate cache by pattern (e.g., all keys for a resource)
 * Uses Redis SCAN for efficient pattern matching
 */
export async function invalidateCachePattern(
  pattern: string
): Promise<boolean> {
  try {
    // Find all keys matching the pattern
    let cursor = "0";
    let keys: string[] = [];

    do {
      const [nextCursor, matchedKeys] = await redisClient.scan(
        cursor,
        "MATCH",
        `${config.redis.keyPrefix}*${pattern}*`,
        "COUNT",
        "100"
      );

      cursor = nextCursor;
      keys = [...keys, ...matchedKeys];
    } while (cursor !== "0");

    // Delete found keys in batches
    if (keys.length > 0) {
      // Remove prefix from keys
      const prefixLength = config.redis.keyPrefix.length;
      const strippedKeys = keys.map((k) => k.substring(prefixLength));

      // Delete from memory cache
      strippedKeys.forEach((k) => memoryCache.del(k));

      // Delete from Redis in batches of 50
      const batches = [];
      for (let i = 0; i < keys.length; i += 50) {
        batches.push(keys.slice(i, i + 50));
      }

      for (const batch of batches) {
        if (batch.length > 0) {
          await redisClient.del(...batch);
        }
      }
    }

    return true;
  } catch (error) {
    logger.error(`Cache pattern invalidation error for pattern ${pattern}:`, {
      error: (error as Error).message,
    });
    return false;
  }
}

/**
 * Get or set cache with automatic fallback to data fetcher
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  category: keyof typeof CACHE_CATEGORIES = "STANDARD",
  customTTL?: number
): Promise<T> {
  // Try to get from cache first
  const cachedData = await getFromCache<T>(key, category);
  if (cachedData !== null) {
    return cachedData;
  }

  // If not in cache, fetch fresh data
  const freshData = await fetcher();

  // Store in cache and return data
  await setInCache<T>(key, freshData, category, customTTL);
  return freshData;
}

/**
 * Cache health check
 */
export async function checkCacheHealth(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error("Cache health check failed:", { error });
    return false;
  }
}

export default {
  getFromCache,
  setInCache,
  deleteFromCache,
  invalidateCachePattern,
  getOrSetCache,
  checkCacheHealth,
  CACHE_CATEGORIES,
};
