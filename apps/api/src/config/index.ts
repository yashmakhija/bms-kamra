import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
  },
  database: {
    connectionPoolMax: parseInt(process.env.DATABASE_POOL_MAX || "25", 10),
    connectionPoolIdleTimeout: parseInt(
      process.env.DATABASE_IDLE_TIMEOUT || "30000",
      10
    ),
    connectionTimeout: parseInt(
      process.env.DATABASE_CONNECTION_TIMEOUT || "10000",
      10
    ),
    queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || "30000", 10),
    debugEnabled: process.env.DEBUG_PRISMA === "true",
    primaryConnection: process.env.DATABASE_URL,
    readReplicaUrls: process.env.DATABASE_READ_REPLICAS
      ? process.env.DATABASE_READ_REPLICAS.split(",")
      : [],
    useReadReplica: process.env.USE_READ_REPLICA === "true",
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || "2", 10),
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10", 10),
    connectionTimeoutMs: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || "30000",
      10
    ),
    statementTimeoutMs: parseInt(
      process.env.DB_STATEMENT_TIMEOUT || "60000",
      10
    ),
    shardingEnabled: process.env.DB_SHARDING_ENABLED === "true",
    shardingKey: process.env.DB_SHARDING_KEY || "userId",
    shardCount: parseInt(process.env.DB_SHARD_COUNT || "1", 10),
  },
  auth: {
    jwtSecret:
      process.env.JWT_SECRET || "default_jwt_secret_key_change_in_production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    keyPrefix: process.env.REDIS_KEY_PREFIX || "bms:",
    useTLS: process.env.REDIS_USE_TLS === "true",
    db: parseInt(process.env.REDIS_DB || "0", 10),
    enableCluster: process.env.REDIS_CLUSTER_ENABLED === "true",
    clusterNodes: process.env.REDIS_CLUSTER_NODES
      ? process.env.REDIS_CLUSTER_NODES.split(",")
      : [],
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || "3600", 10), // 1 hour
    highVolumeTTL: parseInt(process.env.REDIS_HIGH_VOLUME_TTL || "300", 10), // 5 minutes
    longTermTTL: parseInt(process.env.REDIS_LONG_TERM_TTL || "86400", 10), // 24 hours
    seatAvailabilityTTL: parseInt(
      process.env.SEAT_AVAILABILITY_TTL || "60",
      10
    ), // 1 minute
  },
  cache: {
    showTTL: parseInt(process.env.CACHE_SHOW_TTL || "60", 10), // Reduced to 1 minute (was 3600/1 hour)
    venueTTL: parseInt(process.env.CACHE_VENUE_TTL || "300", 10), // Reduced to 5 minutes (was 7200/2 hours)
    categoryTTL: parseInt(process.env.CACHE_CATEGORY_TTL || "600", 10), // Reduced to 10 minutes (was 86400/24 hours)
    seatAvailabilityTTL: parseInt(process.env.CACHE_SEAT_TTL || "30", 10), // 30 seconds (was 60 seconds)

    eventTTL: parseInt(process.env.CACHE_EVENT_TTL || "60", 10), // 1 minute
    showtimeTTL: parseInt(process.env.CACHE_SHOWTIME_TTL || "60", 10), // 1 minute
    priceTierTTL: parseInt(process.env.CACHE_PRICE_TIER_TTL || "60", 10), // 1 minute
    seatSectionTTL: parseInt(process.env.CACHE_SEAT_SECTION_TTL || "60", 10), // 1 minute
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // 100 requests per minute
    standardHeaders: process.env.RATE_LIMIT_HEADERS !== "false", // Send standard rate limit headers
    legacyHeaders: false, // Don't use legacy headers
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    maxFiles: process.env.LOG_MAX_FILES || "14d",
  },
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || "5", 10),
    limiter: {
      max: parseInt(process.env.QUEUE_RATE_LIMIT_MAX || "1000", 10),
      duration: parseInt(process.env.QUEUE_RATE_LIMIT_DURATION || "60000", 10), // 1 minute
    },
    monitoringEnabled: process.env.QUEUE_MONITORING_ENABLED === "true",
    monitoringPath: process.env.QUEUE_MONITORING_PATH || "/admin/queues",
  },
};
