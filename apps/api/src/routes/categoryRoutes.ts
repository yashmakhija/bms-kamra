import { Router } from "express";
import {
  getAllCategoriesHandler,
  getCategoryByIdHandler,
  getCategoriesByTypeHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from "../controllers/categoryController";
import {
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware,
} from "../middlewares/authMiddleware";
import generalRateLimit from "../middlewares/rateLimitMiddleware";
import { AdminRole } from "../types";

const router: Router = Router();

// Public routes
router.get("/", generalRateLimit, getAllCategoriesHandler);
router.get("/type/:type", generalRateLimit, getCategoriesByTypeHandler);
router.get("/:categoryId", generalRateLimit, getCategoryByIdHandler);

// Admin routes - require admin authentication
router.post(
  "/",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"] as AdminRole[]),
  generalRateLimit,
  createCategoryHandler
);

router.put(
  "/:categoryId",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN", "EDITOR"] as AdminRole[]),
  generalRateLimit,
  updateCategoryHandler
);

router.delete(
  "/:categoryId",
  authMiddleware,
  isAdminMiddleware,
  hasRoleMiddleware(["SUPER_ADMIN"] as AdminRole[]),
  generalRateLimit,
  deleteCategoryHandler
);

export default router;
