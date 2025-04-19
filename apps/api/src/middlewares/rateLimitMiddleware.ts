import rateLimit from "express-rate-limit";
import { createClient } from "redis";
import { RedisStore } from "rate-limit-redis";
import { config } from "../config";
import { createServiceLogger } from "../utils/logger";
import { StatusCodes } from "http-status-codes";

const logger = createServiceLogger("rate-limit");

// Create Redis client specifically for rate limiting
// We use the standard Redis client here rather than IORedis to maintain compatibility with rate-limit-redis
const redisClient = createClient({
  url: config.redis.url,
  password: config.redis.password,
});

// Connect to Redis and handle events
(async () => {
  try {
    await redisClient.connect();
    logger.info("Rate limiter Redis client connected");
  } catch (error) {
    logger.error("Error connecting to Redis for rate limiting:", { error });
  }
})();

redisClient.on("error", (err) => {
  logger.error("Rate limiter Redis client error:", { error: err });
});

// Default rate limit configuration
const defaultRateLimitOptions = {
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  message: {
    status: "error",
    code: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too many requests, please try again later.",
  },
  skip: (req: any) => {
    // Skip rate limiting for certain IP addresses or internal calls if needed
    return false;
  },
  keyGenerator: (req: any) => {
    // Use IP address as default (with x-forwarded-for header support for proxies)
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    return `${ip}:${req.method}:${req.path}`;
  },
};

// Helper function to create a new Redis store with a unique prefix
function createRedisStore(prefix: string) {
  return new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args as any),
    prefix: `${config.redis.keyPrefix}${prefix}:`,
  });
}

// Create general rate limiter
export const generalRateLimit = rateLimit({
  ...defaultRateLimitOptions,
  store: createRedisStore("general"),
  skip: (req: any) => {
    // Skip rate limiting for healthcheck endpoints
    if (req.path === "/health" || req.path === "/api/health") {
      return true;
    }
    return false;
  },
});

// Create auth rate limiter (more strict)
export const authRateLimit = rateLimit({
  ...defaultRateLimitOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes
  store: createRedisStore("auth"),
  keyGenerator: (req: any) => {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    return `auth:${ip}`;
  },
  message: {
    status: "error",
    code: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too many login attempts, please try again later.",
  },
});

// Create API key rate limiter
export const apiKeyRateLimit = (
  maxRequests: number = 1000,
  windowMs: number = 60 * 60 * 1000
) => {
  return rateLimit({
    ...defaultRateLimitOptions,
    windowMs,
    max: maxRequests,
    store: createRedisStore("apikey"),
    keyGenerator: (req: any) => {
      // Use API key as the rate limit key
      const apiKey = req.headers["x-api-key"] || "unknown";
      return `apikey:${apiKey}`;
    },
  });
};

// Higher rate limits for public endpoints that need it
export const publicEndpointRateLimit = rateLimit({
  ...defaultRateLimitOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  store: createRedisStore("public"),
});

export default generalRateLimit;
