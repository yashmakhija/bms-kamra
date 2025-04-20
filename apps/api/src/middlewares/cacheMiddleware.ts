import { Request, Response, NextFunction } from "express";
import {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  default as redisClient,
} from "../utils/redis";
import { createServiceLogger } from "../utils/logger";
import { config } from "../config";

const logger = createServiceLogger("cache-middleware");

// Routes that should skip caching
const SKIP_CACHE_ROUTES = ["/auth", "/webhook", "/api/payment"];

/**
 * Middleware to cache responses for GET requests
 * @param options Cache options containing TTL in seconds
 */
export const cacheMiddleware = (options: { ttl?: number } = {}) => {
  const ttlSeconds = options.ttl || config.redis.defaultTTL;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip caching for non-cacheable routes
    const shouldSkipCache = SKIP_CACHE_ROUTES.some((route) =>
      req.originalUrl.startsWith(route)
    );

    if (shouldSkipCache) {
      return next();
    }

    try {
      // Create a cache key based on the URL and user ID (if authenticated)
      const userId = req.user ? req.user.id : "anonymous";
      const cacheKey = `api:${userId}:${req.originalUrl}`;

      // Check if we have a cached response
      const cachedData = await getCache<{ data: any; timestamp: number }>(
        cacheKey
      );

      if (cachedData) {
        // Add cache header to indicate this was a cache hit
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Timestamp", cachedData.timestamp.toString());

        logger.debug(`Cache hit for ${cacheKey}`);

        return res.json(cachedData.data);
      }

      // Add a response interceptor to cache the response
      const originalSend = res.json;
      res.json = function (body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const dataToCache = {
            data: body,
            timestamp: Date.now(),
          };

          // Don't await the cache operation to avoid blocking the response
          setCache(cacheKey, dataToCache, ttlSeconds).catch((error) => {
            logger.error(`Failed to cache response for ${cacheKey}:`, {
              error: (error as Error).message,
            });
          });

          res.setHeader("X-Cache", "MISS");
        }

        return originalSend.call(this, body);
      };

      return next();
    } catch (error) {
      logger.error("Cache middleware error:", {
        error: (error as Error).message,
      });
      return next();
    }
  };
};

/**
 * Type definition for Express Request with user property
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to invalidate cache for specific routes
 * @param patterns Array of route patterns to invalidate
 */
export function invalidateCacheMiddleware(patterns: string[] = []) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate cache for non-GET requests
    if (req.method === "GET") {
      return next();
    }

    // Store original end method
    const originalEnd = res.end;

    // Override end method to invalidate cache after successful response
    // @ts-ignore - Bypass type checking for the end method
    res.end = function (this: Response, ...args: any[]): Response {
      // Only invalidate cache for successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Get user ID
        const userId = req.user?.id || "anonymous";

        // Match patterns against originalUrl
        const shouldInvalidate =
          patterns.length === 0 ||
          patterns.some(
            (pattern) =>
              req.originalUrl.startsWith(pattern) ||
              new RegExp(pattern).test(req.originalUrl)
          );

        if (shouldInvalidate) {
          // Delete specific cache keys
          // This runs in the background and doesn't block the response
          invalidateRelatedCacheKeys(userId, patterns).catch((err) => {
            logger.error("Error invalidating cache:", { error: err.message });
          });
        }
      }

      // Call original end method with all arguments
      // @ts-ignore - Bypass type checking for apply method with args
      return originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Specialized middleware for show creation flow to invalidate interrelated caches
 * This ensures newly created entities are immediately available for the next steps
 */
export function showCreationCacheInvalidation() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only for non-GET requests
    if (req.method === "GET") {
      return next();
    }

    // Store original end method
    const originalEnd = res.end;

    // Override end method to invalidate cache after successful response
    // @ts-ignore - Bypass type checking for the end method
    res.end = function (this: Response, ...args: any[]): Response {
      // Only invalidate cache for successful responses (created/updated)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Determine which entity type was created/updated
        let patternsToInvalidate: string[] = [];

        // Extract IDs from request URL or body for more targeted invalidation
        const { showId, eventId, venueId } = req.params;

        // Handle different entity creation scenarios
        if (req.originalUrl.includes("/venues")) {
          // Venue created/updated
          patternsToInvalidate = ["/venues"];
          if (venueId) {
            patternsToInvalidate.push(`/venues/${venueId}`);
          }
        } else if (req.originalUrl.includes("/shows")) {
          // Show created/updated
          patternsToInvalidate = ["/shows"];
          if (showId) {
            patternsToInvalidate.push(`/shows/${showId}`);
          }
          // Also invalidate venue caches as they include show counts
          patternsToInvalidate.push("/venues");
        } else if (req.originalUrl.includes("/events")) {
          // Event created/updated
          patternsToInvalidate = ["/events"];
          if (eventId) {
            patternsToInvalidate.push(`/events/${eventId}`);
          }
          // Invalidate parent show's events list
          if (showId) {
            patternsToInvalidate.push(`/shows/${showId}`);
            patternsToInvalidate.push(`/shows/${showId}/events`);
          }
        } else if (req.originalUrl.includes("/showtimes")) {
          // Showtime created/updated
          patternsToInvalidate = ["/showtimes"];
          if (eventId) {
            patternsToInvalidate.push(`/events/${eventId}`);
            patternsToInvalidate.push(`/events/${eventId}/showtimes`);
          }
        } else if (req.originalUrl.includes("/price-tiers")) {
          // Price tier created/updated
          patternsToInvalidate = ["/price-tiers"];
          // Invalidate show price tiers
          if (req.body && req.body.showId) {
            patternsToInvalidate.push(`/shows/${req.body.showId}`);
            patternsToInvalidate.push(`/shows/${req.body.showId}/price-tiers`);
          }
        } else if (req.originalUrl.includes("/seat-sections")) {
          // Seat section created/updated
          patternsToInvalidate = ["/seat-sections"];
          // Invalidate showtime seat sections
          if (req.body && req.body.showtimeId) {
            patternsToInvalidate.push(`/showtimes/${req.body.showtimeId}`);
            patternsToInvalidate.push(
              `/showtimes/${req.body.showtimeId}/seat-sections`
            );
          }
        }

        // If patterns were identified, invalidate them for all users
        if (patternsToInvalidate.length > 0) {
          // For public entities, we need to invalidate for all users, not just the current one
          invalidateGlobalCachePatterns(patternsToInvalidate).catch((err) => {
            logger.error("Error invalidating show creation cache:", {
              error: err.message,
            });
          });
        }
      }

      // Call original end method with all arguments
      // @ts-ignore - Bypass type checking for apply method with args
      return originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Helper function to invalidate related cache keys
 */
async function invalidateRelatedCacheKeys(userId: string, patterns: string[]) {
  try {
    // Get all cache keys
    const keys = await redisClient.keys(`api:${userId}:*`);

    if (keys.length === 0) {
      return;
    }

    // Filter keys based on patterns
    const keysToDelete = keys.filter((key: string) => {
      // If no patterns provided, delete all keys for the user
      if (patterns.length === 0) {
        return true;
      }

      // Otherwise, check if key matches any pattern
      return patterns.some((pattern) => {
        const urlPath = key.split(`api:${userId}:`)[1];
        return (
          urlPath?.startsWith(pattern) ||
          new RegExp(pattern).test(urlPath || "")
        );
      });
    });

    if (keysToDelete.length > 0) {
      // Delete keys
      await redisClient.del(keysToDelete);
      logger.debug("Invalidated cache keys:", { count: keysToDelete.length });
    }
  } catch (error) {
    logger.error("Error invalidating cache keys:", {
      error: (error as Error).message,
    });
  }
}

/**
 * Helper function to invalidate cache patterns globally for all users
 * This is essential for public entities that might be cached for multiple users
 */
async function invalidateGlobalCachePatterns(patterns: string[]) {
  try {
    // For each pattern, find and delete all matching keys for all users
    for (const pattern of patterns) {
      // Create a Redis pattern that matches the URL pattern for any user
      const redisPattern = `api:*:*${pattern}*`;
      const keys = await redisClient.keys(redisPattern);

      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.debug(`Invalidated ${keys.length} keys for pattern ${pattern}`);
      }
    }
  } catch (error) {
    logger.error("Error invalidating global cache patterns:", {
      error: (error as Error).message,
    });
  }
}

export default cacheMiddleware;
