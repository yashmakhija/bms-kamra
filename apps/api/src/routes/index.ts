import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import adminRoutes from "./adminRoutes";
import venueRoutes from "./venueRoutes";
import categoryRoutes from "./categoryRoutes";
import showRoutes from "./showRoutes";
import bookingRoutes from "./bookingRoutes";
import priceTierRoutes from "./priceTierRoutes";
import seatSectionRoutes from "./seatSectionRoutes";
import razorpayRoutes from "./razorpayRoutes";
import { StatusCodes } from "http-status-codes";
import cacheMiddleware, {
  showCreationCacheInvalidation,
} from "../middlewares/cacheMiddleware";
import {
  authRateLimit,
  publicEndpointRateLimit,
  generalRateLimit,
} from "../middlewares/rateLimitMiddleware";
import { createServiceLogger } from "../utils/logger";
import { config } from "../config";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  bookingQueue,
  ticketQueue,
  paymentQueue,
  notificationQueue,
} from "../lib/queue";
import { JobId } from "bull";
const router: Router = Router();
const logger = createServiceLogger("routes");

// Health check endpoint - no rate limiting or caching
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: config.server.nodeEnv,
  });
});

// API routes with appropriate middleware
// Auth routes - apply auth-specific rate limiting
router.use("/auth", authRoutes);

// User routes - general rate limiting
router.use("/users", generalRateLimit, userRoutes);

// Admin routes - general rate limiting, no caching
router.use("/admin", generalRateLimit, adminRoutes);

// Public content routes with higher rate limits and caching
// Venues
router.use(
  "/venues",
  publicEndpointRateLimit,
  showCreationCacheInvalidation(),
  cacheMiddleware({ ttl: config.cache.venueTTL }),
  venueRoutes
);

// Categories
router.use(
  "/categories",
  publicEndpointRateLimit,
  showCreationCacheInvalidation(),
  cacheMiddleware({ ttl: config.cache.categoryTTL }),
  categoryRoutes
);

// Shows
router.use(
  "/shows",
  publicEndpointRateLimit,
  showCreationCacheInvalidation(),
  cacheMiddleware({ ttl: config.cache.showTTL }),
  showRoutes
);

// Price Tiers
router.use(
  "/price-tiers",
  publicEndpointRateLimit,
  showCreationCacheInvalidation(),
  cacheMiddleware({ ttl: config.cache.showTTL }),
  priceTierRoutes
);

// Seat Sections
router.use(
  "/seat-sections",
  publicEndpointRateLimit,
  showCreationCacheInvalidation(),
  cacheMiddleware({ ttl: config.cache.showTTL }),
  seatSectionRoutes
);

// Bookings - general rate limiting, no global caching as bookings are dynamic
router.use("/bookings", generalRateLimit, bookingRoutes);

// Razorpay - payment gateway integration
router.use("/razorpay", generalRateLimit, razorpayRoutes);

// Add job status endpoint
router.get("/jobs/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Try to find the job in each queue
    const queues = [bookingQueue, ticketQueue, paymentQueue, notificationQueue];
    const queueNames = ["booking", "ticket", "payment", "notification"];

    for (let i = 0; i < queues.length; i++) {
      const job = await queues[i]?.getJob(jobId as JobId);

      if (job) {
        const state = await job.getState();
        const reason = job.failedReason;
        const result = job.returnvalue;

        return res.status(StatusCodes.OK).json({
          jobId,
          queue: queueNames[i],
          state,
          ...(reason && { reason }),
          ...(result && { result }),
          data: job.data,
          progress: job.progress(),
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Job not found in any queue
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Job not found",
      jobId,
    });
  } catch (error) {
    console.error("Error getting job status:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to get job status",
      error: (error as Error).message,
    });
  }
});

// Catch-all for invalid routes
router.all("*", (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  return res.status(StatusCodes.NOT_FOUND).json({
    status: "error",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: StatusCodes.NOT_FOUND,
  });
});

export default router;
