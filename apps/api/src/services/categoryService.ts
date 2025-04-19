import { Prisma, CategoryType } from "@repo/database";
import { prisma } from "../lib/prisma";
import { createServiceLogger } from "../utils/logger";

// Define PaginationOptions interface if not available from imports
interface PaginationOptions {
  page?: number;
  limit?: number;
}

const logger = createServiceLogger("categoryService");

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
  type: CategoryType,
  isActive = true
) => {
  try {
    return prisma.category.findMany({
      where: {
        type,
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
 * Create a new category
 */
export const createCategory = async (data: {
  name: string;
  type: CategoryType;
  description?: string;
}) => {
  try {
    return prisma.category.create({
      data,
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
    type?: CategoryType;
    description?: string;
    isActive?: boolean;
    capacity?: number;
  }
) => {
  try {
    return prisma.category.update({
      where: { id },
      data,
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
