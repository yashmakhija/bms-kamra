import { prisma } from "@repo/database";

/**
 * Get all venues with pagination
 */
export const getAllVenues = async (page = 1, limit = 10, isActive = true) => {
  const skip = (page - 1) * limit;

  const venues = await prisma.venue.findMany({
    where: { isActive },
    skip,
    take: limit,
    orderBy: { name: "asc" },
  });

  const total = await prisma.venue.count({ where: { isActive } });

  return {
    venues,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get venue by ID
 */
export const getVenueById = async (id: string) => {
  return prisma.venue.findUnique({
    where: { id },
    include: {
      shows: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          imageUrl: true,
        },
      },
    },
  });
};

/**
 * Create a new venue
 */
export const createVenue = async (data: {
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  description?: string;
  imageUrl?: string;
}) => {
  return prisma.venue.create({
    data,
  });
};

/**
 * Update an existing venue
 */
export const updateVenue = async (
  id: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    capacity?: number;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
  }
) => {
  return prisma.venue.update({
    where: { id },
    data,
  });
};

/**
 * Delete a venue (soft delete by marking as inactive)
 */
export const deleteVenue = async (id: string) => {
  return prisma.venue.update({
    where: { id },
    data: { isActive: false },
  });
};
