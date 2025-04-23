import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { findUserById, getUserAdminRole } from "../services/userService";
import { AuthRequest, AdminRole } from "../types";
import { createServiceLogger } from "../utils/logger";

const authLogger = createServiceLogger("auth-middleware");

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const requestPath = req.path;
  const method = req.method;
  const userAgent = req.headers["user-agent"] || "unknown";
  const referer = req.headers.referer || "unknown";

  // Log basic request info
  authLogger.info(`Auth middleware processing request`, {
    path: requestPath,
    method,
    userAgent: userAgent.substring(0, 100), // Truncate to avoid huge logs
    referer,
    hasAuthHeader: !!req.headers.authorization,
    timestamp: new Date().toISOString(),
  });

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      authLogger.warn(`Auth failed - No valid auth header`, {
        path: requestPath,
        authHeader: authHeader ? "Present but invalid" : "Missing",
        headerKeys: Object.keys(req.headers).join(","),
      });

      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Log token info (without revealing the actual token)
    authLogger.info(`Processing token`, {
      path: requestPath,
      tokenLength: token?.length || 0,
      tokenPrefix: token ? token.substring(0, 10) + "..." : "invalid token", // Just log a prefix for debugging
    });

    const decoded = verifyToken(token ?? "");

    if (!decoded || !decoded.userId) {
      authLogger.warn(`Auth failed - Invalid token`, {
        path: requestPath,
        tokenValid: !!decoded,
        hasUserId: decoded && !!decoded.userId,
        decodedData: decoded ? "Present but invalid" : "Decode failed",
      });

      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    // Log successful token decode
    authLogger.info(`Token decoded successfully`, {
      path: requestPath,
      userId: decoded.userId,
      tokenExp: (decoded as any).exp
        ? new Date((decoded as any).exp * 1000).toISOString()
        : "unknown",
    });

    const user = await findUserById(decoded.userId);

    if (!user) {
      authLogger.warn(`Auth failed - User not found`, {
        path: requestPath,
        userId: decoded.userId,
      });

      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Log successful authentication
    authLogger.info(`Authentication successful`, {
      path: requestPath,
      userId: user.id,
      isAdmin: !!user.admin,
      adminRole: user.admin?.role || "none",
    });

    // Set user data on the request object
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.admin?.role || undefined,
      isAdmin: !!user.admin,
    };
    req.isAdmin = !!user.admin;

    next();
  } catch (error) {
    // Enhanced error logging
    authLogger.error(`Auth middleware error`, {
      path: requestPath,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack available",
    });

    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const isAdminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.isAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden - Admin access required" });
  }

  next();
};

export const isSuperAdminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.isAdmin || req.user.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ message: "Forbidden - Super admin access required" });
  }

  next();
};

export const hasRoleMiddleware = (allowedRoles: AdminRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden - Admin access required" });
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role as AdminRole)) {
      return res.status(403).json({
        message: `Forbidden - Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};
