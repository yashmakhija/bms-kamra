import { Prisma } from "@repo/database";
import { prisma } from "../lib/database";
import {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
} from "../utils/redis";
import { config } from "../config";
import { createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("show-service");

/**
 * Get all shows with pagination
 */
export const getAllShows = async (page = 1, limit = 10, isActive = true) => {
  const cacheKey = `shows:all:page${page}:limit${limit}:active${isActive}`;

  try {
    // Try to get from cache first
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const skip = (page - 1) * limit;

    const shows = await prisma.show.findMany({
      where: { isActive },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        priceTiers: {
          where: { isActive: true },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.show.count({ where: { isActive } });

    const result = {
      shows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result
    await setCache(cacheKey, result, config.cache.showTTL);

    return result;
  } catch (error) {
    logger.error("Error getting all shows", { error, page, limit, isActive });

    // Fall back to direct database query
    const skip = (page - 1) * limit;

    const shows = await prisma.show.findMany({
      where: { isActive },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        priceTiers: {
          where: { isActive: true },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.show.count({ where: { isActive } });

    return {
      shows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
};

/**
 * Get show by ID with details
 */
export const getShowById = async (id: string) => {
  const cacheKey = `show:${id}:details`;

  try {
    // Try to get from cache first
    const cachedShow = await getCache(cacheKey);
    if (cachedShow) {
      return cachedShow;
    }

    const show = await prisma.show.findUnique({
      where: { id },
      include: {
        venue: true,
        priceTiers: {
          where: { isActive: true },
          include: {
            category: true,
          },
        },
        events: {
          where: { isActive: true },
          include: {
            showtimes: {
              where: { isActive: true },
              include: {
                seatSections: {
                  where: { isActive: true },
                  include: {
                    priceTier: {
                      include: {
                        category: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (show) {
      // Cache the result
      await setCache(cacheKey, show, config.cache.showTTL);
    }

    return show;
  } catch (error) {
    logger.error("Error getting show by ID", { error, showId: id });

    // Fall back to direct database query
    return prisma.show.findUnique({
      where: { id },
      include: {
        venue: true,
        priceTiers: {
          where: { isActive: true },
          include: {
            category: true,
          },
        },
        events: {
          where: { isActive: true },
          include: {
            showtimes: {
              where: { isActive: true },
              include: {
                seatSections: {
                  where: { isActive: true },
                  include: {
                    priceTier: {
                      include: {
                        category: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }
};

/**
 * Create a new show
 */
export const createShow = async (data: {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  ageLimit?: string;
  language?: string;
  venueId: string;
  categoryIds?: string[];
}) => {
  try {
    // Extract categoryIds from data
    const { categoryIds, ...showData } = data;

    // Create the show without categories - they'll be connected via price tiers
    const show = await prisma.show.create({
      data: showData,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    // If categoryIds are provided, create price tiers for each category
    if (categoryIds && categoryIds.length > 0) {
      // Create a price tier for each category
      for (const categoryId of categoryIds) {
        await prisma.priceTier.create({
          data: {
            showId: show.id,
            categoryId,
            price: new Prisma.Decimal(0), // Default price, will be updated later
            capacity: 0, // Default capacity, will be updated later
          },
        });
      }
    }

    // Invalidate cache for all shows
    await deleteCachePattern("shows:all:*");

    logger.info("Show created successfully", {
      showId: show.id,
      title: show.title,
    });

    return show;
  } catch (error) {
    logger.error("Error creating show", { error, data });
    throw error;
  }
};

/**
 * Update an existing show
 */
export const updateShow = async (
  id: string,
  data: {
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    ageLimit?: string;
    language?: string;
    venueId?: string;
    isActive?: boolean;
    categoryIds?: string[];
  }
) => {
  try {
    // Extract categoryIds from data
    const { categoryIds, ...showData } = data;

    const show = await prisma.show.update({
      where: { id },
      data: showData,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        priceTiers: {
          include: {
            category: true,
          },
        },
      },
    });

    // If categoryIds are provided, update price tiers
    if (categoryIds && categoryIds.length > 0) {
      // Get current price tiers to compare
      const currentPriceTiers = await prisma.priceTier.findMany({
        where: { showId: id },
        select: { categoryId: true },
      });

      const currentCategoryIds = currentPriceTiers.map((pt) => pt.categoryId);

      // Categories to add (in categoryIds but not in currentCategoryIds)
      const categoriesToAdd = categoryIds.filter(
        (cId) => !currentCategoryIds.includes(cId)
      );

      // Add new price tiers
      for (const categoryId of categoriesToAdd) {
        await prisma.priceTier.create({
          data: {
            showId: id,
            categoryId,
            price: new Prisma.Decimal(0), // Default price
            capacity: 0, // Default capacity
          },
        });
      }
    }

    // Invalidate related caches
    await Promise.all([
      deleteCachePattern(`show:${id}:*`),
      deleteCachePattern("shows:all:*"),
    ]);

    logger.info("Show updated successfully", {
      showId: id,
      title: show.title,
    });

    return show;
  } catch (error) {
    logger.error("Error updating show", { error, showId: id, data });
    throw error;
  }
};

/**
 * Delete a show (soft delete)
 */
export const deleteShow = async (id: string) => {
  try {
    await prisma.show.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate related caches
    await Promise.all([
      deleteCache(`show:${id}:details`),
      deleteCachePattern(`show:${id}:*`),
      deleteCachePattern("shows:all:*"),
    ]);

    logger.info("Show deleted successfully", { showId: id });

    return { success: true };
  } catch (error) {
    logger.error("Error deleting show", { error, showId: id });
    throw error;
  }
};

/**
 * Create a new event for a show
 */
export const createEvent = async (data: { showId: string; date: Date }) => {
  try {
    const event = await prisma.event.create({
      data,
      include: {
        show: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Invalidate relevant caches
    await Promise.all([
      deleteCache(`show:${data.showId}:details`),
      deleteCachePattern(`show:${data.showId}:events*`),
    ]);

    logger.info("Event created successfully", {
      eventId: event.id,
      showId: data.showId,
      date: data.date,
    });

    return event;
  } catch (error) {
    logger.error("Error creating event", { error, data });
    throw error;
  }
};

/**
 * Create a new showtime for an event
 */
export const createShowtime = async (data: {
  eventId: string;
  startTime: Date;
  endTime: Date;
}) => {
  try {
    const showtime = await prisma.showtime.create({
      data,
      include: {
        event: {
          include: {
            show: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    // Get the related show ID via the event
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: { showId: true },
    });

    if (event) {
      // Invalidate relevant caches
      await Promise.all([
        deleteCache(`show:${event.showId}:details`),
        deleteCachePattern(`event:${data.eventId}:*`),
      ]);
    }

    logger.info("Showtime created successfully", {
      showtimeId: showtime.id,
      eventId: data.eventId,
      startTime: data.startTime,
    });

    return showtime;
  } catch (error) {
    logger.error("Error creating showtime", { error, data });
    throw error;
  }
};

/**
 * Create a seat section for a showtime with the given price tier
 */
export const createSeatSection = async (data: {
  showtimeId: string;
  priceTierId: string;
  name: string;
  availableSeats: number;
}): Promise<any> => {
  try {
    // First check if the price tier exists
    const priceTier = await prisma.priceTier.findUnique({
      where: { id: data.priceTierId },
      include: {
        category: true,
      },
    });

    if (!priceTier) {
      throw new Error(`Price tier with ID ${data.priceTierId} not found`);
    }

    // Create the seat section
    const seatSection = await prisma.seatSection.create({
      data: {
        name: data.name,
        availableSeats: data.availableSeats,
        priceTierId: data.priceTierId,
        showtimeId: data.showtimeId,
      },
      include: {
        priceTier: {
          include: {
            category: true,
          },
        },
      },
    });

    // Prepare ticket data for batch creation
    const ticketData = Array(data.availableSeats)
      .fill(null)
      .map((_, i) => ({
        sectionId: seatSection.id,
        status: "AVAILABLE" as const,
        code: `${seatSection.id}-${i + 1}-${Date.now().toString(36)}`,
        price: priceTier.price,
        currency: priceTier.currency,
      }));

    // Create tickets in batch instead of one by one
    await prisma.ticket.createMany({
      data: ticketData,
    });

    // Get the showtime to access event and show details
    const showtime = await prisma.showtime.findUnique({
      where: { id: data.showtimeId },
      include: {
        event: {
          include: {
            show: true,
          },
        },
      },
    });

    if (showtime) {
      // Invalidate relevant caches
      await Promise.all([
        deleteCache(`show:${showtime.event.showId}:details`),
        deleteCachePattern(`showtime:${data.showtimeId}:*`),
        deleteCachePattern(`api:*:/api/shows*`),
        deleteCachePattern(`api:*:/api/categories*`),
        deleteCachePattern(`api:*:/api/venues*`),
        deleteCachePattern(`api:*:/api/seat-sections*`),
      ]);

      logger.info("Seat section created successfully with tickets", {
        sectionId: seatSection.id,
        showtimeId: data.showtimeId,
        categoryType: priceTier.category.type,
        ticketsCreated: data.availableSeats,
      });
    }

    // Return immediately after creating tickets
    return seatSection;
  } catch (error) {
    logger.error("Error creating seat section", { error, data });
    throw error;
  }
};
