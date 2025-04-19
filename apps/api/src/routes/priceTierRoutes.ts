import { Router } from "express";
import {
  getAllPriceTiers,
  getPriceTierById,
  getPriceTiersByShowId,
  createPriceTier,
  updatePriceTier,
  deletePriceTier,
} from "../controllers/priceTierController";
import {
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware,
} from "../middlewares/authMiddleware";

const router: Router = Router();

// Public routes
router.get("/", getAllPriceTiers);
router.get("/:priceTierId", getPriceTierById);
router.get("/show/:showId", getPriceTiersByShowId);

// Admin routes - require admin authentication
router.post(
  "/",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"]),
  createPriceTier
);

router.put(
  "/:priceTierId",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"]),
  updatePriceTier
);

router.delete(
  "/:priceTierId",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN"]),
  deletePriceTier
);

export default router;
