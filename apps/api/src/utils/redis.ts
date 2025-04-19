import Redis, { Cluster, RedisOptions } from "ioredis";
import { config } from "../config";
import { createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("redis-service");

// Redis client options
const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  password: config.redis.password || undefined,
  keyPrefix: config.redis.keyPrefix,
};

// Create Redis client (standalone or cluster)
let redisClient: Redis | Cluster;

if (config.redis.enableCluster && config.redis.clusterNodes.length > 0) {
  // Create a Redis cluster client
  const clusterNodes = config.redis.clusterNodes.map((node) => {
    const [host, port] = node.split(":");
    return {
      host,
      port: parseInt(port || "6379", 10),
    };
  });

  redisClient = new Cluster(clusterNodes, {
    scaleReads: "slave",
    redisOptions,
  });

  logger.info("Connected to Redis cluster");
} else {
  // Create a standalone Redis client
  redisClient = new Redis(config.redis.url, redisOptions);
  logger.info(`Connected to Redis at ${config.redis.url}`);
}

// Set up event listeners
redisClient.on("error", (error: Error) => {
  logger.error("Redis client error:", { error: error.message });
});

redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis client reconnecting");
});

// Helper functions
export const getCache = async <T>(key: string): Promise<T | null> => {
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

export const setCache = async <T>(
  key: string,
  data: T,
  ttlSeconds: number = config.redis.defaultTTL
): Promise<boolean> => {
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

export const deleteCache = async (key: string): Promise<boolean> => {
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

export const deleteCachePattern = async (pattern: string): Promise<boolean> => {
  try {
    const keys = await redisClient.keys(`${config.redis.keyPrefix}${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error(`Error deleting cache pattern ${pattern}:`, {
      error: (error as Error).message,
    });
    return false;
  }
};

export const getOrSetCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = config.redis.defaultTTL
): Promise<T> => {
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

export const incrementValue = async (key: string): Promise<number> => {
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
