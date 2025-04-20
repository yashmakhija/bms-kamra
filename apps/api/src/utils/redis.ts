import Redis, { Cluster, RedisOptions } from "ioredis";
import { config } from "../config";
import { createServiceLogger } from "../utils/logger";
import { EventEmitter } from "events";

const logger = createServiceLogger("redis-service");

export const redisEvents = new EventEmitter();

// Redis client options
const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(Math.pow(2, times) * 100, 30000);
    logger.debug(`Redis connection retry in ${delay}ms (attempt ${times})`);
    return delay;
  },
  reconnectOnError(err) {
    const targetError =
      err.message.includes("READONLY") ||
      err.message.includes("LOADING") ||
      err.message.includes("BUSY");
    return targetError;
  },
  password: config.redis.password || undefined,
  keyPrefix: config.redis.keyPrefix,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Create Redis client (standalone or cluster)
let redisClient: Redis | Cluster;
let redisHealthy = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

function createRedisClient(): Redis | Cluster {
  if (config.redis.enableCluster && config.redis.clusterNodes.length > 0) {
    const clusterNodes = config.redis.clusterNodes.map((node) => {
      const [host, port] = node.split(":");
      return {
        host,
        port: parseInt(port || "6379", 10),
      };
    });

    return new Cluster(clusterNodes, {
      scaleReads: "slave",
      redisOptions,
      clusterRetryStrategy(times: number) {
        const delay = Math.min(Math.pow(2, times) * 100, 30000);
        logger.debug(
          `Redis cluster connection retry in ${delay}ms (attempt ${times})`
        );

        if (times >= MAX_CONNECTION_ATTEMPTS) {
          logger.error(
            `Failed to connect to Redis cluster after ${times} attempts`
          );
          redisEvents.emit("connection:failed");
          return null;
        }

        return delay;
      },
    });
  } else {
    return new Redis(config.redis.url, redisOptions);
  }
}

function initializeRedisClient() {
  redisClient = createRedisClient();
  connectionAttempts++;

  redisClient.on("error", (error: Error) => {
    redisHealthy = false;
    logger.error("Redis client error:", { error: error.message });
    redisEvents.emit("error", error);
  });

  redisClient.on("connect", () => {
    logger.info("Redis client connected");
    redisEvents.emit("connect");
  });

  redisClient.on("ready", () => {
    redisHealthy = true;
    connectionAttempts = 0; // Reset counter on successful connection
    logger.info("Redis client ready");
    redisEvents.emit("ready");
  });

  redisClient.on("reconnecting", () => {
    logger.warn("Redis client reconnecting");
    redisEvents.emit("reconnecting");
  });

  redisClient.on("end", () => {
    redisHealthy = false;
    logger.warn("Redis connection closed");
    redisEvents.emit("end");

    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      logger.warn(
        `Too many connection attempts (${connectionAttempts}). Waiting before retrying...`
      );
      setTimeout(() => {
        connectionAttempts = 0;

        initializeRedisClient();
      }, 60000);
    }
  });

  setTimeout(checkRedisHealth, 15000);

  return redisClient;
}

async function checkRedisHealth() {
  if (!redisClient) {
    redisHealthy = false;
    return;
  }

  try {
    await redisClient.ping();
    if (!redisHealthy) {
      redisHealthy = true;
      logger.info("Redis health check: connection restored");
      redisEvents.emit("health:restored");
    }
  } catch (error) {
    redisHealthy = false;
    logger.error("Redis health check failed:", {
      error: (error as Error).message,
    });
    redisEvents.emit("health:failed");

    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      logger.info("Attempting to reconnect to Redis...");
      try {
        await redisClient.quit().catch(() => {});
      } catch (e) {}

      initializeRedisClient();
    }
  }

  setTimeout(checkRedisHealth, 30000);
}

redisClient = initializeRedisClient();

/**
 * Get cache health status
 * @returns Whether the cache is healthy and available
 */
export const getCacheHealth = (): boolean => {
  return redisHealthy;
};

/**
 * Get a value from cache with fallback error handling
 * @param key Cache key
 * @returns Parsed value or null if not found or error
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  if (!redisHealthy) {
    logger.debug(`Cache unavailable, skipping get for key ${key}`);
    return null;
  }

  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error(`Error getting cache for key ${key}:`, {
      error: (error as Error).message,
    });
    return null;
  }
};

/**
 * Set a value in cache with fallback error handling
 * @param key Cache key
 * @param data Data to cache
 * @param ttlSeconds TTL in seconds
 * @returns Whether the operation succeeded
 */
export const setCache = async <T>(
  key: string,
  data: T,
  ttlSeconds: number = config.redis.defaultTTL
): Promise<boolean> => {
  if (!redisHealthy) {
    logger.debug(`Cache unavailable, skipping set for key ${key}`);
    return false;
  }

  try {
    await redisClient.set(key, JSON.stringify(data), "EX", ttlSeconds);
    return true;
  } catch (error) {
    logger.error(`Error setting cache for key ${key}:`, {
      error: (error as Error).message,
    });
    return false;
  }
};

/**
 * Delete a value from cache with fallback error handling
 * @param key Cache key
 * @returns Whether the operation succeeded
 */
export const deleteCache = async (key: string): Promise<boolean> => {
  if (!redisHealthy) {
    logger.debug(`Cache unavailable, skipping delete for key ${key}`);
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Error deleting cache for key ${key}:`, {
      error: (error as Error).message,
    });
    return false;
  }
};

/**
 * Delete multiple cache keys matching a pattern
 * @param pattern Pattern to match
 * @returns Whether the operation succeeded
 */
export const deleteCachePattern = async (pattern: string): Promise<boolean> => {
  if (!redisHealthy) {
    logger.debug(`Cache unavailable, skipping pattern delete for ${pattern}`);
    return false;
  }

  try {
    const keys = await redisClient.keys(`${config.redis.keyPrefix}${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug(`Deleted ${keys.length} keys matching pattern ${pattern}`);
    }
    return true;
  } catch (error) {
    logger.error(`Error deleting cache pattern ${pattern}:`, {
      error: (error as Error).message,
    });
    return false;
  }
};

/**
 * Get or set a value in cache
 * @param key Cache key
 * @param fetcher Function to fetch the data if not in cache
 * @param ttlSeconds TTL in seconds
 * @returns The value from cache or fetcher
 */
export const getOrSetCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = config.redis.defaultTTL
): Promise<T> => {
  // If Redis is unhealthy, bypass cache entirely
  if (!redisHealthy) {
    logger.debug(`Cache unavailable, bypassing for key ${key}`);
    return fetcher();
  }

  try {
    const cachedData = await getCache<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }

    const freshData = await fetcher();
    await setCache(key, freshData, ttlSeconds);
    return freshData;
  } catch (error) {
    logger.error(`Error in getOrSetCache for key ${key}:`, {
      error: (error as Error).message,
    });
    // Fallback to fetcher directly
    return fetcher();
  }
};

/**
 * Increment a counter in cache
 * @param key Counter key
 * @returns New value or 0 if operation failed
 */
export const incrementValue = async (key: string): Promise<number> => {
  if (!redisHealthy) {
    logger.debug(`Cache unavailable, skipping increment for key ${key}`);
    return 0;
  }

  try {
    return await redisClient.incr(key);
  } catch (error) {
    logger.error(`Error incrementing value for key ${key}:`, {
      error: (error as Error).message,
    });
    return 0;
  }
};

export const acquireLock = async (
  lockKey: string,
  ttlSeconds: number = 30
): Promise<boolean> => {
  const identifier = Math.random().toString(36).substring(2, 15);
  try {
    // Use Redis SET with NX and EX options for atomic lock acquisition
    const result = await redisClient.set(
      `lock:${lockKey}`,
      identifier,
      "EX",
      ttlSeconds,
      "NX"
    );
    return result === "OK";
  } catch (error) {
    logger.error(`Error acquiring lock for key ${lockKey}:`, {
      error: (error as Error).message,
    });
    return false;
  }
};

export const releaseLock = async (lockKey: string): Promise<boolean> => {
  try {
    await redisClient.del(`lock:${lockKey}`);
    return true;
  } catch (error) {
    logger.error(`Error releasing lock for key ${lockKey}:`, {
      error: (error as Error).message,
    });
    return false;
  }
};

export default redisClient;
