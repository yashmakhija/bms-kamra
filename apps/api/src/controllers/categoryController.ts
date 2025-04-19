import { Request, Response } from "express";
import { AuthRequest } from "../types";
import * as categoryService from "../services/categoryService";
import { createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("categoryController");

// Define category types as string literals
const CATEGORY_TYPES = ["VIP", "PREMIUM", "REGULAR", "ECONOMY"] as const;
type CategoryType = (typeof CATEGORY_TYPES)[number];

/**
 * Validate pagination parameters from request query
 */
function validatePaginationParams(query: any) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  return { page, limit };
}

/**
 * Get all categories with pagination
 */
export async function getAllCategoriesHandler(req: Request, res: Response) {
  try {
    const { page, limit } = validatePaginationParams(req.query);
    const categories = await categoryService.getAllCategories({ page, limit });
    return res.status(200).json(categories);
  } catch (error: any) {
    logger.error(`Error fetching categories: ${error.message}`);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
}

/**
 * Get category by ID
 */
export async function getCategoryByIdHandler(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const category = await categoryService.getCategoryById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json(category);
  } catch (error: any) {
    logger.error(`Error fetching category: ${error.message}`);
    return res.status(500).json({ message: "Failed to fetch category" });
  }
}

/**
 * Validate category data
 */
function validateCategoryData(data: any) {
  const errors = [];

  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push("Name is required and must be a non-empty string");
  }

  if (!data.type || !CATEGORY_TYPES.includes(data.type)) {
    errors.push(
      `Type is required and must be one of: ${CATEGORY_TYPES.join(", ")}`
    );
  }

  if (data.description !== undefined && typeof data.description !== "string") {
    errors.push("Description must be a string");
  }

  if (data.capacity !== undefined) {
    const capacity = parseInt(data.capacity, 10);
    if (isNaN(capacity) || capacity <= 0) {
      errors.push("Capacity must be a positive integer");
    }
  }

  return errors;
}

/**
 * Create a new category (Admin only)
 */
export async function createCategoryHandler(req: AuthRequest, res: Response) {
  try {
    const categoryData = req.body;

    // Validate input data
    const validationErrors = validateCategoryData(categoryData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const newCategory = await categoryService.createCategory(categoryData);
    return res.status(201).json(newCategory);
  } catch (error: any) {
    logger.error(`Error creating category: ${error.message}`);
    return res.status(500).json({ message: "Failed to create category" });
  }
}

/**
 * Update an existing category (Admin only)
 */
export async function updateCategoryHandler(req: AuthRequest, res: Response) {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const categoryData = req.body;

    // Validate input data for fields that are present
    const validationErrors = [];

    if (
      categoryData.name !== undefined &&
      (typeof categoryData.name !== "string" || categoryData.name.trim() === "")
    ) {
      validationErrors.push("Name must be a non-empty string");
    }

    if (
      categoryData.type !== undefined &&
      !CATEGORY_TYPES.includes(categoryData.type)
    ) {
      validationErrors.push(
        `Type must be one of: ${CATEGORY_TYPES.join(", ")}`
      );
    }

    if (
      categoryData.description !== undefined &&
      typeof categoryData.description !== "string"
    ) {
      validationErrors.push("Description must be a string");
    }

    if (categoryData.capacity !== undefined) {
      const capacity = parseInt(categoryData.capacity, 10);
      if (isNaN(capacity) || capacity <= 0) {
        validationErrors.push("Capacity must be a positive integer");
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const updatedCategory = await categoryService.updateCategory(
      categoryId,
      categoryData
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json(updatedCategory);
  } catch (error: any) {
    logger.error(`Error updating category: ${error.message}`);
    return res.status(500).json({ message: "Failed to update category" });
  }
}

/**
 * Delete a category (Admin only, soft delete)
 */
export async function deleteCategoryHandler(req: Request, res: Response) {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const result = await categoryService.deleteCategory(categoryId);

    if (!result) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error: any) {
    logger.error(`Error deleting category: ${error.message}`);
    return res.status(500).json({ message: "Failed to delete category" });
  }
}

/**
 * Get categories by type
 */
export async function getCategoriesByTypeHandler(req: Request, res: Response) {
  try {
    const { type } = req.params;
    if (!type) {
      return res.status(400).json({ message: "Category type is required" });
    }

    if (!CATEGORY_TYPES.includes(type as CategoryType)) {
      return res.status(400).json({
        message: `Invalid category type. Must be one of: ${CATEGORY_TYPES.join(", ")}`,
      });
    }

    const categories = await categoryService.getCategoriesByType(
      type as CategoryType
    );
    return res.status(200).json(categories);
  } catch (error: any) {
    logger.error(`Error fetching categories by type: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to fetch categories by type" });
  }
}
