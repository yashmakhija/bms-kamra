import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { requestLogFormat, createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("http");

/**
 * Generate a request ID if one doesn't exist
 * This helps with tracing requests through the system
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers["x-request-id"] || randomUUID();

  // Set the request ID in the request and response objects
  req.requestId = requestId as string;
  res.setHeader("x-request-id", requestId);

  next();
};

/**
 * Record response time for requests
 */
export const responseTimeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startHrTime = process.hrtime();

  // Add a hook for when the response is finished
  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = Math.round(
      elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6
    );
    res.responseTime = elapsedTimeInMs;
  });

  next();
};

/**
 * Log all HTTP requests
 */
export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log request received
  const startHrTime = process.hrtime();
  const requestId = req.requestId || "unknown";

  // We don't want to log sensitive information
  const sanitizedHeaders = { ...req.headers };
  if (sanitizedHeaders.authorization) {
    sanitizedHeaders.authorization = "REDACTED";
  }
  if (sanitizedHeaders.cookie) {
    sanitizedHeaders.cookie = "REDACTED";
  }

  // Log request data with debug level
  logger.debug("Request received", {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    headers: sanitizedHeaders,
    query: req.query,
    body: sanitizeRequestBody(req.body),
  });

  // Add a hook for when the response is finished
  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = Math.round(
      elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6
    );

    const logData = {
      requestId,
      ...requestLogFormat(req, res),
      responseTime: elapsedTimeInMs,
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error("Server error response", logData);
    } else if (res.statusCode >= 400) {
      logger.warn("Client error response", logData);
    } else if (elapsedTimeInMs > 1000) {
      // Log slow requests as warnings
      logger.warn("Slow response", logData);
    } else {
      logger.info("Request completed", logData);
    }
  });

  next();
};

/**
 * Middleware to handle and log errors
 */
export const errorLoggingMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.requestId || "unknown";

  logger.error("Unhandled error", {
    requestId,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    request: {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      userId: req.user?.id || "unauthenticated",
    },
  });

  // Send response to client
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    message:
      statusCode === 500
        ? "An unexpected error occurred" // Don't expose internal error details
        : err.message,
    requestId,
  });
};

/**
 * Sanitize request body to avoid logging sensitive information
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return body;

  const sensitiveFields = [
    "password",
    "newPassword",
    "oldPassword",
    "confirmPassword",
    "token",
    "accessToken",
    "refreshToken",
    "credit_card",
    "creditCard",
    "cardNumber",
    "cvv",
    "cvc",
    "ssn",
  ];

  // Create a copy of the body to avoid modifying the original
  const sanitized = { ...body };

  // Recursively sanitize objects
  Object.keys(sanitized).forEach((key) => {
    // If this is a sensitive field, redact it
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = "REDACTED";
    }
    // If this is an object, recursively sanitize it
    else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeRequestBody(sanitized[key]);
    }
  });

  return sanitized;
}

// Add response time property to Express Response interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
    interface Response {
      responseTime?: number;
    }
    interface User {
      id: string;
    }
  }
}

export default {
  requestIdMiddleware,
  responseTimeMiddleware,
  requestLoggingMiddleware,
  errorLoggingMiddleware,
};
