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
} from "../controllers/showController";
import {
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware,
} from "../middlewares/authMiddleware";
import { AdminRole } from "../types";

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
  createSeatSection
);

export default router;
