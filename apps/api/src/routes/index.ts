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
import cacheMiddleware from "../middlewares/cacheMiddleware";
import {
  authRateLimit,
  publicEndpointRateLimit,
  generalRateLimit,
} from "../middlewares/rateLimitMiddleware";
import { createServiceLogger } from "../utils/logger";
import { config } from "../config";

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
router.use("/auth", authRateLimit, authRoutes);

// User routes - general rate limiting
router.use("/users", generalRateLimit, userRoutes);

// Admin routes - general rate limiting, no caching
router.use("/admin", generalRateLimit, adminRoutes);

// Public content routes with higher rate limits and caching
// Venues
router.use(
  "/venues",
  publicEndpointRateLimit,
  cacheMiddleware({ ttl: config.cache.venueTTL }),
  venueRoutes
);

// Categories
router.use(
  "/categories",
  publicEndpointRateLimit,
  cacheMiddleware({ ttl: config.cache.categoryTTL }),
  categoryRoutes
);

// Shows
router.use(
  "/shows",
  publicEndpointRateLimit,
  cacheMiddleware({ ttl: config.cache.showTTL }),
  showRoutes
);

// Price Tiers
router.use(
  "/price-tiers",
  publicEndpointRateLimit,
  cacheMiddleware({ ttl: config.cache.showTTL }),
  priceTierRoutes
);

// Seat Sections
router.use(
  "/seat-sections",
  publicEndpointRateLimit,
  cacheMiddleware({ ttl: config.cache.showTTL }),
  seatSectionRoutes
);

// Bookings - general rate limiting, no global caching as bookings are dynamic
router.use("/bookings", generalRateLimit, bookingRoutes);

// Razorpay - payment gateway integration
router.use("/razorpay", generalRateLimit, razorpayRoutes);

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
