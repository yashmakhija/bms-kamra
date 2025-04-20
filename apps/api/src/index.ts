import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import "express-async-errors";
import compression from "compression";
import apiRoutes from "./routes";
import { config } from "./config";
import logger, { createServiceLogger } from "./utils/logger";
import loggingMiddleware from "./middlewares/loggingMiddleware";
import { generalRateLimit } from "./middlewares/rateLimitMiddleware";
import { StatusCodes } from "http-status-codes";
import { prisma } from "./lib/database";
import checkDatabaseConnection from "./utils/dbCheck";
import { initializeDefaultCategories } from "./services/categoryService";

// Create application instance
const app = express();
const serverLogger = createServiceLogger("server");

// Apply security middlewares
app.use(helmet());
app.use(cors());

// Apply compression middleware
app.use(compression());

// Apply rate limiting
app.use(generalRateLimit);

// Request logging and tracking middleware
app.use(loggingMiddleware.requestIdMiddleware);
app.use(loggingMiddleware.responseTimeMiddleware);
app.use(loggingMiddleware.requestLoggingMiddleware);

// Parse request bodies
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Mount API routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  // Check database connectivity
  const dbConnected = await checkDatabaseConnection();

  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbConnected ? "connected" : "disconnected",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: "error",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: StatusCodes.NOT_FOUND,
  });
});

// Error handler
app.use(loggingMiddleware.errorLoggingMiddleware);

// Initialize database with default data
const initializeData = async () => {
  try {
    // Initialize default categories (VIP, PREMIUM, REGULAR)
    await initializeDefaultCategories();
    serverLogger.info("Default data initialization completed successfully");
  } catch (error) {
    serverLogger.error("Error initializing default data", { error });
  }
};

// Start the server
const PORT = config.server.port;
const server = app.listen(PORT, async () => {
  serverLogger.info(
    `Server started in ${config.server.nodeEnv} mode on port ${PORT}`
  );

  // Initialize default data after server starts
  await initializeData();
});

// Set timeout for long-running requests
server.timeout = 120000; // 120 seconds (2 minutes)

// Handle graceful shutdown
const shutdown = async (signal: string) => {
  serverLogger.info(`${signal} received, shutting down gracefully...`);

  // Close the HTTP server
  server.close(async () => {
    serverLogger.info("HTTP server closed");

    // Close Prisma connection
    try {
      await prisma.$disconnect();
      serverLogger.info("Database connections closed");
    } catch (err) {
      serverLogger.error("Error disconnecting from database", { err });
    }

    // Close any other connections (Redis, etc.)
    // This is where you'd clean up other connections

    serverLogger.info("All connections closed, exiting process");
    process.exit(0);
  });

  // If server doesn't close in 10s, force exit
  setTimeout(() => {
    serverLogger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  serverLogger.error("Uncaught exception", { error });

  // For uncaught exceptions, we want to exit the process after logging
  // This allows the process manager (PM2, etc.) to restart the service
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  serverLogger.error("Unhandled rejection", { reason, promise });

  // We don't exit here to prevent the service from shutting down
  // due to an unhandled rejection, but we log it for monitoring
});

export default server;
