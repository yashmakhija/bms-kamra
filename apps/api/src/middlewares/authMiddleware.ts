import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { findUserById, getUserAdminRole } from "../services/userService";
import { AuthRequest, AdminRole } from "../types";

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token ?? "");

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

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
