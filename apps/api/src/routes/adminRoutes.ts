import { Router } from "express";
import {
  authMiddleware,
  isAdminMiddleware,
  isSuperAdminMiddleware,
  hasRoleMiddleware,
} from "../middlewares/authMiddleware";

// We'll implement these controllers later
import {
  getAdminProfile,
  getAllUsers,
  getUserById,
  createAdmin,
} from "../controllers/adminController";

import {
  getDashboardStats,
  getBookingAnalytics,
  getRevenueStats,
  getUserStats,
} from "../controllers/analyticsController";

const router: Router = Router();

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(isAdminMiddleware);

router.get("/profile", getAdminProfile);

router.get("/users", hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"]), getAllUsers);

router.get(
  "/users/:userId",
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"]),
  getUserById
);

router.post("/create", isSuperAdminMiddleware, createAdmin);

router.delete(
  "/users/:userId",
  isSuperAdminMiddleware
  /*deleteUser - to be implemented*/
);

// Dashboard and analytics routes
router.get("/dashboard/stats", getDashboardStats);
router.get("/analytics/bookings", getBookingAnalytics);
router.get("/analytics/revenue", getRevenueStats);
router.get("/analytics/users", getUserStats);

export default router;
