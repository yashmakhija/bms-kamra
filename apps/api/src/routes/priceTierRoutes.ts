import { Router } from "express";
import * as priceTierController from "../controllers/priceTierController";

import { body } from "express-validator";
import {
  isAdminMiddleware,
  hasRoleMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware";

const router: Router = Router();

// Get all price tiers
router.get("/", priceTierController.getAllPriceTiers);

// Get price tier by ID
router.get("/:priceTierId", priceTierController.getPriceTierById);

// Get price tiers by show ID
router.get("/show/:showId", priceTierController.getPriceTiersByShowId);

// Create a new price tier (Admin only)
router.post(
  "/",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"]),
  [
    body("showId").notEmpty().withMessage("Show ID is required"),
    body("categoryType")
      .notEmpty()
      .withMessage("Category type is required")
      .isIn(["VIP", "PREMIUM", "REGULAR"])
      .withMessage("Category type must be one of: VIP, PREMIUM, REGULAR"),
    body("capacity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Capacity must be a non-negative integer"),
    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("currency")
      .optional()
      .isString()
      .withMessage("Currency must be a string"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
  ],

  priceTierController.createPriceTier
);

// Update an existing price tier (Admin only)
router.put(
  "/:priceTierId",
  isAdminMiddleware,
  [
    body("capacity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Capacity must be a positive integer"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number"),
    body("currency")
      .optional()
      .isString()
      .withMessage("Currency must be a string"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],

  priceTierController.updatePriceTier
);

// Delete a price tier (Admin only)
router.delete(
  "/:priceTierId",
  isAdminMiddleware,
  priceTierController.deletePriceTier
);

export default router;
