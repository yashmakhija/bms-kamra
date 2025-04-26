import { Prisma, CategoryType } from "@repo/database";
import { prisma } from "../lib/prisma";
import { createServiceLogger } from "../utils/logger";

// Define PaginationOptions interface if not available from imports
interface PaginationOptions {
  page?: number;
  limit?: number;
}

const logger = createServiceLogger("categoryService");

// Fixed set of categories - we'll use these instead of creating new ones each time
const DEFAULT_CATEGORIES = [
  {
    name: "VIP",
    type: CategoryType.VIP,
    description: "Premium experience with the best seats and services",
  },
  {
    name: "PREMIUM",
    type: CategoryType.PREMIUM,
    description: "Great seats with excellent view and comfort",
  },
  {
    name: "REGULAR",
    type: CategoryType.REGULAR,
    description: "Standard seating with good view",
  },
];

/**
 * Initialize default categories if they don't exist
 * This should be called during app startup
 */
export const initializeDefaultCategories = async () => {
  try {
    for (const category of DEFAULT_CATEGORIES) {
      const existingCategory = await prisma.category.findFirst({
        where: { type: category.type, isActive: true },
      });

      if (!existingCategory) {
        await prisma.category.create({ data: category });
        logger.info(`Created default category: ${category.name}`);
      }
    }
    logger.info("Default categories initialized");
  } catch (error) {
    logger.error("Error initializing default categories", { error });
    throw error;
  }
};

/**
 * Get all categories with pagination
 */
export const getAllCategories = async ({
  page = 1,
  limit = 10,
  isActive = true,
}: PaginationOptions & { isActive?: boolean } = {}) => {
  const skip = (page - 1) * limit;

  try {
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where: { isActive },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.category.count({ where: { isActive } }),
    ]);

    return {
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error getting all categories", { error });
    throw error;
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string, isActive = true) => {
  try {
    return prisma.category.findFirst({
      where: {
        id,
        ...(isActive ? { isActive: true } : {}),
      },
    });
  } catch (error) {
    logger.error(`Error getting category by ID: ${id}`, { error });
    throw error;
  }
};

/**
 * Get categories by type
 */
export const getCategoriesByType = async (
  type: keyof typeof CategoryType,
  isActive = true
) => {
  try {
    return prisma.category.findMany({
      where: {
        type: CategoryType[type],
        ...(isActive ? { isActive: true } : {}),
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    logger.error(`Error getting categories by type: ${type}`, { error });
    throw error;
  }
};

/**
 * Get default category by type or create if it doesn't exist
 * This should be used instead of creating new categories
 */
export const getDefaultCategoryByType = async (
  type: keyof typeof CategoryType
) => {
  try {
    // Find existing category of the specified type
    let category = await prisma.category.findFirst({
      where: { type: CategoryType[type], isActive: true },
    });

    // If no category exists with this type, create one using our defaults
    if (!category) {
      const defaultCategory = DEFAULT_CATEGORIES.find(
        (c) => c.type === CategoryType[type]
      );
      if (!defaultCategory) {
        throw new Error(`No default configuration for category type: ${type}`);
      }

      category = await prisma.category.create({
        data: defaultCategory,
      });
      logger.info(`Created default category for type: ${type}`);
    }

    return category;
  } catch (error) {
    logger.error(`Error getting/creating default category by type: ${type}`, {
      error,
    });
    throw error;
  }
};

/**
 * Create a new category
 * Note: This is now restricted to admins and should rarely be used
 * as we prefer using the default categories
 */
export const createCategory = async (data: {
  name: string;
  type: keyof typeof CategoryType;
  description?: string;
}) => {
  try {
    // First check if a category with this type already exists
    const existingCategory = await prisma.category.findFirst({
      where: { type: CategoryType[data.type], isActive: true },
    });

    if (existingCategory) {
      logger.warn(`Attempted to create duplicate category type: ${data.type}`);
      return existingCategory;
    }

    return prisma.category.create({
      data: {
        ...data,
        type: CategoryType[data.type],
      },
    });
  } catch (error) {
    logger.error("Error creating category", { error, data });
    throw error;
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (
  id: string,
  data: {
    name?: string;
    type?: keyof typeof CategoryType;
    description?: string;
    isActive?: boolean;
    capacity?: number;
  }
) => {
  try {
    return prisma.category.update({
      where: { id },
      data: {
        ...data,
        ...(data.type ? { type: CategoryType[data.type] } : {}),
      },
    });
  } catch (error) {
    logger.error(`Error updating category: ${id}`, { error, data });
    throw error;
  }
};

/**
 * Delete a category (soft delete by marking as inactive)
 */
export const deleteCategory = async (id: string) => {
  try {
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    logger.error(`Error deleting category: ${id}`, { error });
    throw error;
  }
};
