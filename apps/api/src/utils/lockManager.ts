import { createServiceLogger } from "./logger";
import redisClient from "./redis";
import { v4 as uuidv4 } from "uuid";

const logger = createServiceLogger("lock-manager");

/**
 * Distributed lock manager using Redis to handle race conditions
 * Uses Redis SET with NX and expiration for atomic lock acquisition
 * Includes owner verification to prevent lock stealing
 */
export class LockManager {
  static async acquireLock(
    resourceKey: string,
    ttlMs: number = 30000
  ): Promise<string | null> {
    try {
      const lockToken = uuidv4();
      const lockKey = `lock:${resourceKey}`;

      const result = await redisClient.set(
        lockKey,
        lockToken,
        "PX",
        ttlMs,
        "NX"
      );

      if (result === "OK") {
        logger.debug(
          `Lock acquired for ${resourceKey} with token ${lockToken}`
        );
        return lockToken;
      }

      logger.debug(
        `Failed to acquire lock for ${resourceKey} - already locked`
      );
      return null;
    } catch (error) {
      logger.error(`Error acquiring lock for ${resourceKey}:`, {
        error: (error as Error).message,
      });
      return null;
    }
  }

  static async extendLock(
    resourceKey: string,
    lockToken: string,
    ttlMs: number = 30000
  ): Promise<boolean> {
    try {
      const lockKey = `lock:${resourceKey}`;

      const script = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("PEXPIRE", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await redisClient.eval(
        script,
        1,
        lockKey,
        lockToken,
        ttlMs.toString()
      );

      const success = result === 1;
      if (success) {
        logger.debug(
          `Lock extended for ${resourceKey} with token ${lockToken}`
        );
      } else {
        logger.warn(
          `Failed to extend lock for ${resourceKey} - token mismatch or lock expired`
        );
      }

      return success;
    } catch (error) {
      logger.error(`Error extending lock for ${resourceKey}:`, {
        error: (error as Error).message,
      });
      return false;
    }
  }

  static async releaseLock(
    resourceKey: string,
    lockToken: string
  ): Promise<boolean> {
    try {
      const lockKey = `lock:${resourceKey}`;

      const script = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        else
          return 0
        end
      `;

      const result = await redisClient.eval(script, 1, lockKey, lockToken);

      const success = result === 1;
      if (success) {
        logger.debug(
          `Lock released for ${resourceKey} with token ${lockToken}`
        );
      } else {
        logger.warn(
          `Failed to release lock for ${resourceKey} - token mismatch or lock expired`
        );
      }

      return success;
    } catch (error) {
      logger.error(`Error releasing lock for ${resourceKey}:`, {
        error: (error as Error).message,
      });
      return false;
    }
  }

  static async withLock<T>(
    resourceKey: string,
    fn: () => Promise<T>,
    options: {
      ttlMs?: number;
      retryCount?: number;
      retryDelayMs?: number;
    } = {}
  ): Promise<T | null> {
    const { ttlMs = 30000, retryCount = 3, retryDelayMs = 500 } = options;

    let acquiredLockToken: string | null = null;

    for (let attempt = 0; attempt < retryCount; attempt++) {
      acquiredLockToken = await this.acquireLock(resourceKey, ttlMs);
      if (acquiredLockToken) break;

      if (attempt < retryCount - 1) {
        const jitter = Math.floor(Math.random() * 200);
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelayMs + jitter)
        );
      }
    }

    if (!acquiredLockToken) {
      logger.warn(
        `Failed to acquire lock for ${resourceKey} after ${retryCount} attempts`
      );
      return null;
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(resourceKey, acquiredLockToken);
    }
  }
}
