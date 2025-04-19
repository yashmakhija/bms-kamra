import { Prisma, CategoryType } from "@repo/database";
import { prisma } from "../lib/database";
import { createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("price-tier-service");

/**
 * Get all price tiers with pagination
 */
export const getAllPriceTiers = async (
  page = 1,
  limit = 10,
  isActive = true,
  showId?: string
) => {
  const skip = (page - 1) * limit;

  const whereClause: Prisma.PriceTierWhereInput = { isActive };
  if (showId) {
    whereClause.showId = showId;
  }

  try {
    const [priceTiers, total] = await Promise.all([
      prisma.priceTier.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { price: "desc" },
        include: {
          show: {
            select: {
              id: true,
              title: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      }),
      prisma.priceTier.count({ where: whereClause }),
    ]);

    return {
      priceTiers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error fetching price tiers", { error, page, limit, showId });
    throw error;
  }
};

/**
 * Get price tier by ID
 */
export const getPriceTierById = async (id: string) => {
  try {
    return await prisma.priceTier.findUnique({
      where: { id },
      include: {
        show: true,
        category: true,
      },
    });
  } catch (error) {
    logger.error("Error fetching price tier by ID", { error, id });
    throw error;
  }
};

/**
 * Get price tiers by show ID
 */
export const getPriceTiersByShowId = async (showId: string) => {
  try {
    return await prisma.priceTier.findMany({
      where: {
        showId,
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        price: "desc",
      },
    });
  } catch (error) {
    logger.error("Error fetching price tiers by show ID", { error, showId });
    throw error;
  }
};

/**
 * Create a new price tier
 */
export const createPriceTier = async (data: {
  showId: string;
  categoryId: string;
  capacity: number;
  price: number | string;
  currency?: string;
  description?: string;
}) => {
  try {
    // Check if the show and category exist
    const [show, category] = await Promise.all([
      prisma.show.findUnique({ where: { id: data.showId } }),
      prisma.category.findUnique({ where: { id: data.categoryId } }),
    ]);

    if (!show) {
      throw new Error(`Show with ID ${data.showId} not found`);
    }

    if (!category) {
      throw new Error(`Category with ID ${data.categoryId} not found`);
    }

    // Check if a price tier already exists for this show-category combination
    const existingPriceTier = await prisma.priceTier.findFirst({
      where: {
        showId: data.showId,
        categoryId: data.categoryId,
      },
    });

    if (existingPriceTier) {
      throw new Error(
        `A price tier already exists for this show-category combination`
      );
    }

    // Convert price to Prisma.Decimal
    const priceDecimal = new Prisma.Decimal(data.price.toString());

    return await prisma.priceTier.create({
      data: {
        showId: data.showId,
        categoryId: data.categoryId,
        capacity: data.capacity,
        price: priceDecimal,
        currency: data.currency || "INR",
        description: data.description,
      },
      include: {
        show: {
          select: {
            id: true,
            title: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Error creating price tier", { error, data });
    throw error;
  }
};

/**
 * Update an existing price tier
 */
export const updatePriceTier = async (
  id: string,
  data: {
    capacity?: number;
    price?: number | string;
    currency?: string;
    description?: string;
    isActive?: boolean;
  }
) => {
  try {
    const updateData: any = { ...data };

    // Convert price to Prisma.Decimal if provided
    if (data.price !== undefined) {
      updateData.price = new Prisma.Decimal(data.price.toString());
    }

    return await prisma.priceTier.update({
      where: { id },
      data: updateData,
      include: {
        show: {
          select: {
            id: true,
            title: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Error updating price tier", { error, id, data });
    throw error;
  }
};

/**
 * Delete a price tier (soft delete)
 */
export const deletePriceTier = async (id: string) => {
  try {
    // Check if there are any seat sections using this price tier
    const seatSections = await prisma.seatSection.findMany({
      where: { priceTierId: id },
    });

    if (seatSections.length > 0) {
      throw new Error(
        `Cannot delete price tier as it is being used by ${seatSections.length} seat sections`
      );
    }

    return await prisma.priceTier.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    logger.error("Error deleting price tier", { error, id });
    throw error;
  }
};
