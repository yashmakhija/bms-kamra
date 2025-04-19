import { prisma } from "../lib/database";
import { createServiceLogger } from "./logger";

const logger = createServiceLogger("db-check");

/**
 * Check database connectivity
 * This can be used during server startup to ensure the database is accessible
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Run a simple query to check connectivity
    await prisma.$queryRaw`SELECT 1 as connected`;
    logger.info("Database connection successful");
    return true;
  } catch (error) {
    logger.error("Database connection failed", { error });
    return false;
  }
}

export default checkDatabaseConnection;
