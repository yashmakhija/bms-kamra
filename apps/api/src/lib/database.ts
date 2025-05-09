// Re-export everything from @repo/database for convenience
export * from "@repo/database";

// Import and re-export prisma client from our local singleton
import { PrismaClient } from "@repo/database";
import { config } from "../config";
import { createServiceLogger } from "../utils/logger";
import pg from "pg";

const logger = createServiceLogger("database-service");

// Create PostgreSQL connection pool for direct queries when needed
export const pgPool = new pg.Pool({
  connectionString: config.database.primaryConnection,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: config.database.connectionTimeoutMs,
});

// Create read replica pool if configured
export const readReplicaPool =
  config.database.readReplicaUrls.length > 0
    ? new pg.Pool({
        connectionString:
          config.database.readReplicaUrls[
            Math.floor(Math.random() * config.database.readReplicaUrls.length)
          ],
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: config.database.connectionTimeoutMs,
      })
    : null;

// Primary Prisma client for writing
export const prisma: PrismaClient = new PrismaClient({
  datasources: {
    db: {
      url: config.database.primaryConnection,
    },
  },
  log: config.database.debugEnabled
    ? ["query", "info", "warn", "error"]
    : ["error", "warn"],
});

// Prisma client for read operations (points to read replica if configured)
export const prismaReader: PrismaClient =
  config.database.useReadReplica && config.database.readReplicaUrls.length > 0
    ? new PrismaClient({
        datasources: {
          db: {
            url: config.database.readReplicaUrls[
              Math.floor(Math.random() * config.database.readReplicaUrls.length)
            ],
          },
        },
        log: config.database.debugEnabled
          ? ["query", "info", "warn", "error"]
          : ["error", "warn"],
      })
    : prisma;

// Handle database client lifecycle
pgPool.on("error", (err) => {
  logger.error("Postgres pool error:", { error: err.message });
});

if (readReplicaPool) {
  readReplicaPool.on("error", (err) => {
    logger.error("Read replica pool error:", { error: err.message });
  });
}

// Get appropriate database client based on operation type
export function getDbClient(
  operationType: "read" | "write" = "read"
): PrismaClient {
  if (operationType === "read" && config.database.useReadReplica) {
    return prismaReader;
  }
  return prisma;
}

// Sharding helper for distributing data across databases
// This is a simplified implementation - in production you might use a more sophisticated approach
export function getShardKey(id: string | number) {
  const stringId = typeof id === "number" ? id.toString() : id;
  const hash = stringId.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return Math.abs(hash % config.database.shardCount);
}

// Database healthcheck
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error("Database health check failed:", { error });
    return false;
  }
}

// Adding explicit type for the default export to fix the linter error
type DatabaseExports = {
  prisma: PrismaClient;
  prismaReader: PrismaClient;
  pgPool: pg.Pool;
  readReplicaPool: pg.Pool | null;
  getDbClient: (operationType?: "read" | "write") => PrismaClient;
  getShardKey: (id: string | number) => number;
  checkDatabaseHealth: () => Promise<boolean>;
};

export default {
  prisma,
  prismaReader,
  pgPool,
  readReplicaPool,
  getDbClient,
  getShardKey,
  checkDatabaseHealth,
} as DatabaseExports;
