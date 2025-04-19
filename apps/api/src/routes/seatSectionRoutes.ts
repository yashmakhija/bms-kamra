import { Router } from "express";
import {
  createSeatSection,
  getSeatSectionsByShowtimeId,
} from "../controllers/seatSectionController";
import {
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware,
} from "../middlewares/authMiddleware";

const router: Router = Router();

// Public routes
router.get("/showtime/:showtimeId", getSeatSectionsByShowtimeId);

// Admin routes - require admin authentication
router.post(
  "/",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"]),
  createSeatSection
);

export default router;
