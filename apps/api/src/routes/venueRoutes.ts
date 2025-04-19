import { Router } from "express";
import {
  getAllVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
} from "../controllers/venueController";
import {
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware,
} from "../middlewares/authMiddleware";

const router: Router = Router();

// Public routes
router.get("/", getAllVenues);
router.get("/:venueId", getVenueById);

// Admin routes - require admin authentication
router.post(
  "/",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"]),
  createVenue
);

router.put(
  "/:venueId",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"]),
  updateVenue
);

router.delete(
  "/:venueId",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN"]),
  deleteVenue
);

export default router;
