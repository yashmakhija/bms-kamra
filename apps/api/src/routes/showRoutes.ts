import { Router } from "express";
import {
  getAllShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow,
  createEvent,
  createShowtime,
  createSeatSection,
  publishShow,
} from "../controllers/showController";
import {
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware,
} from "../middlewares/authMiddleware";
import { AdminRole } from "../types";
import { body } from "express-validator";

const router: Router = Router();

// Public routes
router.get("/", getAllShows);
router.get("/:showId", getShowById);

// Admin routes for shows
router.post(
  "/",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"] as AdminRole[]),
  createShow
);

router.put(
  "/:showId",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"] as AdminRole[]),
  updateShow
);

router.delete(
  "/:showId",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN"] as AdminRole[]),
  deleteShow
);

// Admin routes for events, showtimes, and seat sections
router.post(
  "/events",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"] as AdminRole[]),
  createEvent
);

router.post(
  "/showtimes",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"] as AdminRole[]),
  createShowtime
);

router.post(
  "/sections",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"] as AdminRole[]),
  [
    body("showtimeId").notEmpty().withMessage("Showtime ID is required"),
    body("priceTierId").notEmpty().withMessage("Price tier ID is required"),
    body("name").notEmpty().withMessage("Section name is required"),
    body("totalSeats")
      .notEmpty()
      .withMessage("Total seats is required")
      .isInt({ min: 1 })
      .withMessage("Total seats must be a positive integer"),
    body("availableSeats")
      .notEmpty()
      .withMessage("Available seats is required")
      .isInt({ min: 0 })
      .withMessage("Available seats must be a non-negative integer"),
  ],
  createSeatSection
);

// Publish show route (Admin only)
router.post(
  "/:showId/publish",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"] as AdminRole[]),
  publishShow
);

export default router;
