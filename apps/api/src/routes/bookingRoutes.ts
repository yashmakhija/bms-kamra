import { Router } from "express";
import {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  processPayment,
  getAllBookings,
} from "../controllers/bookingController";
import {
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware,
} from "../middlewares/authMiddleware";
import { AdminRole } from "../types";

const router: Router = Router();

// All booking routes require authentication
router.use(authMiddleware);

// User booking routes
router.post("/", createBooking);
router.get("/my-bookings", getUserBookings);
router.get("/:bookingId", getBookingById);
router.post("/:bookingId/cancel", cancelBooking);
router.post("/:bookingId/payment", processPayment);

// Admin-only routes
router.get(
  "/admin/all",
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"] as AdminRole[]),
  getAllBookings
);

export default router;
