import { PrismaClient } from "@repo/database";
import { createServiceLogger } from "../utils/logger";
import { config } from "../config";

const logger = createServiceLogger("prisma");

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// This ensures consistent type usage across the app
export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

// Setup query timeout
prisma.$use(async (params, next) => {
  const before = Date.now();

  // Create a timeout for the query
  const timeout = setTimeout(() => {
    logger.warn(`Query timeout reached (${config.database.queryTimeout}ms)`, {
      model: params.model,
      action: params.action,
    });
  }, config.database.queryTimeout);

  const result = await next(params);

  // Clear the timeout since the query completed
  clearTimeout(timeout);

  const after = Date.now();
  const executionTime = after - before;

  // Log slow queries
  if (executionTime > 500) {
    logger.warn(`Slow query detected (${executionTime}ms)`, {
      model: params.model,
      action: params.action,
    });
  }

  return result;
});

// Log Prisma Client events in development
if (process.env.NODE_ENV !== "production") {
  // @ts-expect-error - Prisma's event system typing is complex
  prisma.$on("error", (e: any) => {
    logger.error("Prisma Error", {
      message: e.message,
      target: e.target,
    });
  });

  // @ts-expect-error - Prisma's event system typing is complex
  prisma.$on("warn", (e: any) => {
    logger.warn("Prisma Warning", {
      message: e.message,
      target: e.target,
    });
  });

  if (config.database.debugEnabled) {
    // @ts-expect-error - Prisma's event system typing is complex
    prisma.$on("query", (e: any) => {
      logger.debug("Prisma Query", {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });
  }
}

// For development, don't share the client instance
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
