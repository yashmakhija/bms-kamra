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

    req.user = user;
    req.isAdmin = !!user.admin;
    req.userRole = (user.admin?.role as AdminRole) || null;

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
  if (!req.user || !req.isAdmin || req.userRole !== "SUPER_ADMIN") {
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

    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        message: `Forbidden - Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};
