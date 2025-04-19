import {
  BookingStatus,
  TicketStatus,
  PaymentMethod,
  type Prisma,
} from "@repo/database";
import { prisma } from "../lib/database";
import {
  getCache,
  setCache,
  deleteCache,
  acquireLock,
  releaseLock,
  deleteCachePattern,
} from "../utils/redis";
import { config } from "../config";
import { bookingLogger as logger } from "../utils/logger";
import { AppError } from "../utils/errors";
import { StatusCodes } from "http-status-codes";
import {
  formatBooking,
  formatBookingForAdmin,
} from "../transformers/bookingTransformer";

/**
 * Get the available seat count from cache or database
 */
export const getAvailableSeatCount = async (
  sectionId: string
): Promise<number | null> => {
  const cacheKey = `section:${sectionId}:availableSeats`;

  try {
    // Try to get from cache first
    const cachedCount = await getCache<number>(cacheKey);
    if (cachedCount !== null) {
      return cachedCount;
    }

    // If not in cache, get from database
    const section = await prisma.seatSection.findUnique({
      where: { id: sectionId },
      select: { availableSeats: true },
    });

    if (!section) return null;

    // Cache the result
    await setCache(
      cacheKey,
      section.availableSeats,
      config.cache.seatAvailabilityTTL
    );

    return section.availableSeats;
  } catch (error) {
    logger.error("Failed to get available seat count", { error, sectionId });

    // Fall back to database if cache fails
    try {
      const section = await prisma.seatSection.findUnique({
        where: { id: sectionId },
        select: { availableSeats: true },
      });
      return section?.availableSeats ?? null;
    } catch (dbError) {
      logger.error("Failed to get available seat count from database", {
        error: dbError,
        sectionId,
      });
      return null;
    }
  }
};

/**
 * Create a new booking for tickets
 */
export async function createBooking(bookingData: {
  userId: string;
  showtimeId: string;
  sectionId: string;
  quantity: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
}) {
  const { userId, showtimeId, sectionId, quantity } = bookingData;

  // Get a distributed lock for this section to prevent race conditions
  const lockKey = `booking:section:${sectionId}`;
  const lockAcquired = await acquireLock(lockKey, 30); // 30 second lock

  if (!lockAcquired) {
    logger.warn("Failed to acquire lock for booking creation", {
      sectionId,
      userId,
    });
    throw new AppError(
      "System is currently processing another booking for this section. Please try again.",
      StatusCodes.TOO_MANY_REQUESTS
    );
  }

  try {
    // Increase transaction timeout to 30 seconds
    return await prisma.$transaction(
      async (tx) => {
        // 1. Check if section has enough available seats
        const seatSection = await tx.seatSection.findUnique({
          where: { id: sectionId },
          include: {
            priceTier: true,
          },
        });

        if (!seatSection) {
          throw new AppError("Section not found", StatusCodes.NOT_FOUND);
        }

        if (seatSection.availableSeats < quantity) {
          throw new AppError(
            "Not enough seats available",
            StatusCodes.BAD_REQUEST
          );
        }

        // 2. Get available tickets from the section
        const availableTickets = await tx.ticket.findMany({
          where: {
            sectionId,
            status: "AVAILABLE",
          },
          take: quantity,
        });

        if (availableTickets.length < quantity) {
          throw new AppError(
            "Not enough tickets available",
            StatusCodes.BAD_REQUEST
          );
        }

        // 3. Calculate total amount
        const totalAmount = seatSection.priceTier.price.toNumber() * quantity;

        // 4. Create a booking record
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expires in 15 minutes if not paid

        const booking = await tx.booking.create({
          data: {
            userId,
            totalAmount: totalAmount.toString(),
            currency: seatSection.priceTier.currency,
            status: "PENDING",
            expiresAt,
          },
        });

        // 5. Update tickets to reserved status - OPTIMIZED: use updateMany instead of Promise.all with individual updates
        await tx.ticket.updateMany({
          where: {
            id: {
              in: availableTickets.map((ticket) => ticket.id),
            },
          },
          data: {
            status: "RESERVED",
          },
        });

        // Then connect tickets to booking in a separate operation
        for (const ticket of availableTickets) {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              tickets: {
                connect: { id: ticket.id },
              },
            },
          });
        }

        // 6. Update available seats in the section
        await tx.seatSection.update({
          where: { id: sectionId },
          data: {
            availableSeats: seatSection.availableSeats - quantity,
          },
        });

        // Get full booking details to return
        const bookingWithDetails = await tx.booking.findUnique({
          where: { id: booking.id },
          include: {
            tickets: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Cache invalidation - update available seat count
        const cacheKey = `section:${sectionId}:availableSeats`;
        await setCache(
          cacheKey,
          seatSection.availableSeats - quantity,
          config.cache.seatAvailabilityTTL
        );

        return formatBooking(bookingWithDetails!);
      },
      {
        timeout: 30000, // Increase transaction timeout to 30 seconds
      }
    );
  } catch (error) {
    logger.error("Error creating booking", { error });

    // Clean up the lock regardless of success or failure
    await releaseLock(lockKey);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to create booking",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  } finally {
    // Ensure lock is released
    await releaseLock(lockKey);
  }
}

/**
 * Get bookings for a user
 */
export const getUserBookings = async (userId: string) => {
  const cacheKey = `user:${userId}:bookings`;

  try {
    // Try to get from cache first
    const cachedBookings = await getCache(cacheKey);
    if (cachedBookings) {
      return cachedBookings;
    }

    // Get user bookings
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        tickets: {
          include: {
            section: {
              include: {
                showtime: {
                  include: {
                    event: {
                      include: {
                        show: {
                          select: {
                            id: true,
                            title: true,
                            imageUrl: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format bookings for response
    const formattedBookings = bookings.map((booking) => formatBooking(booking));

    // Cache the result (short TTL for bookings as they change often)
    await setCache(cacheKey, formattedBookings, 300); // 5 minutes

    return formattedBookings;
  } catch (error) {
    logger.error("Error getting user bookings", { error, userId });

    // Fallback to direct database query without caching
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        tickets: {
          include: {
            section: {
              include: {
                showtime: {
                  include: {
                    event: {
                      include: {
                        show: {
                          select: {
                            id: true,
                            title: true,
                            imageUrl: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return bookings.map((booking) => formatBooking(booking));
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (id: string, userId?: string) => {
  const cacheKey = `booking:${id}`;

  try {
    // Try to get from cache first
    const cachedBooking = await getCache<any>(cacheKey);
    if (cachedBooking) {
      // If userId is provided, check if the booking belongs to the user
      if (userId && cachedBooking.userId !== userId) {
        throw new AppError(
          "You don't have permission to view this booking",
          StatusCodes.FORBIDDEN
        );
      }
      return cachedBooking;
    }

    // Get booking from database
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        tickets: {
          include: {
            section: {
              include: {
                showtime: {
                  include: {
                    event: {
                      include: {
                        show: {
                          include: {
                            venue: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
    }

    // If userId is provided, check if the booking belongs to the user
    if (userId && booking.userId !== userId) {
      throw new AppError(
        "You don't have permission to view this booking",
        StatusCodes.FORBIDDEN
      );
    }

    // Format the booking
    const formattedBooking = userId
      ? formatBooking(booking)
      : formatBookingForAdmin(booking);

    // Cache the formatted booking
    if (booking) {
      // Cache the result (short TTL for bookings)
      await setCache(cacheKey, formattedBooking, 300); // 5 minutes
    }

    return formattedBooking;
  } catch (error) {
    logger.error("Error getting booking by ID", { error, bookingId: id });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to fetch booking",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (id: string, userId: string) => {
  // Get a distributed lock for this booking to prevent race conditions
  const lockKey = `booking:${id}:operation`;
  const lockAcquired = await acquireLock(lockKey, 30); // 30 second lock

  if (!lockAcquired) {
    logger.warn("Failed to acquire lock for booking cancellation", {
      bookingId: id,
    });
    throw new AppError(
      "System is currently processing this booking. Please try again shortly.",
      StatusCodes.CONFLICT
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the booking
      const booking = await tx.booking.findUnique({
        where: { id },
        include: {
          tickets: {
            include: {
              section: true,
            },
          },
        },
      });

      if (!booking) {
        throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
      }

      // Check if the booking belongs to the user
      if (booking.userId !== userId) {
        throw new AppError(
          "You don't have permission to cancel this booking",
          StatusCodes.FORBIDDEN
        );
      }

      if (booking.status !== "PENDING") {
        throw new AppError(
          `Cannot cancel booking with status: ${booking.status}`,
          StatusCodes.BAD_REQUEST
        );
      }

      // 2. Update booking status
      await tx.booking.update({
        where: { id },
        data: {
          status: "CANCELED",
        },
      });

      // 3. Update tickets status back to AVAILABLE
      await Promise.all(
        booking.tickets.map(async (ticket) => {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "AVAILABLE",
            },
          });
        })
      );

      // 4. Update available seats in the section
      let sectionId = null;
      let updatedAvailableSeats = 0;

      if (booking.tickets.length > 0) {
        const firstTicket = booking.tickets[0];
        if (firstTicket && firstTicket.section) {
          sectionId = firstTicket.section.id;
          updatedAvailableSeats =
            firstTicket.section.availableSeats + booking.tickets.length;

          await tx.seatSection.update({
            where: { id: sectionId },
            data: {
              availableSeats: updatedAvailableSeats,
            },
          });
        }
      }

      const updatedBooking = await tx.booking.findUnique({
        where: { id },
        include: {
          tickets: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log successful cancellation
      logger.info("Booking cancelled successfully", {
        bookingId: id,
        previousStatus: booking.status,
        ticketsCount: booking.tickets.length,
        sectionId,
      });

      return {
        success: true,
        booking: updatedBooking,
        sectionId,
        updatedAvailableSeats,
      };
    });

    // Cache invalidation
    await deleteCache(`booking:${id}`);
    await deleteCache(`user:${result.booking?.userId}:bookings`);

    // Update seat availability in cache
    if (result.sectionId) {
      await setCache(
        `section:${result.sectionId}:availableSeats`,
        result.updatedAvailableSeats,
        config.cache.seatAvailabilityTTL
      );

      // Invalidate any cached show/section data
      await deleteCachePattern(`show:*:section:${result.sectionId}*`);
    }

    return {
      success: true,
      booking: formatBooking(result.booking),
    };
  } catch (error) {
    logger.error("Error cancelling booking", {
      error: error instanceof Error ? error.message : "Unknown error",
      bookingId: id,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to cancel booking",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  } finally {
    // Always release the lock
    await releaseLock(lockKey);
  }
};

/**
 * Process payment for a booking
 */
export const processPayment = async (
  bookingId: string,
  paymentMethod: PaymentMethod,
  paymentId: string
) => {
  // Get a distributed lock for this booking to prevent race conditions
  const lockKey = `booking:${bookingId}:payment`;
  const lockAcquired = await acquireLock(lockKey, 30); // 30 second lock

  if (!lockAcquired) {
    logger.warn("Failed to acquire lock for payment processing", { bookingId });
    throw new AppError(
      "Payment is currently being processed. Please do not retry payment.",
      StatusCodes.CONFLICT
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          tickets: true,
        },
      });

      if (!booking) {
        throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
      }

      if (booking.status !== "PENDING") {
        throw new AppError(
          `Cannot process payment for booking with status: ${booking.status}`,
          StatusCodes.BAD_REQUEST
        );
      }

      // 2. Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "PAID",
          paymentMethod,
          paymentId,
          paymentDate: new Date(),
        },
      });

      // 3. Update tickets status to SOLD
      await Promise.all(
        booking.tickets.map(async (ticket) => {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "SOLD",
            },
          });
        })
      );

      // Log successful payment
      logger.info("Payment processed successfully", {
        bookingId,
        paymentMethod,
        paymentId,
        userId: booking.userId,
        ticketsCount: booking.tickets.length,
      });

      return {
        success: true,
        booking: updatedBooking,
      };
    });

    // Invalidate cache
    await deleteCache(`booking:${bookingId}`);
    await deleteCache(`user:${result.booking.userId}:bookings`);

    return {
      success: true,
      booking: formatBooking(result.booking),
    };
  } catch (error) {
    logger.error("Error processing payment", {
      error: error instanceof Error ? error.message : "Unknown error",
      bookingId,
      paymentMethod,
      paymentId,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to process payment",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  } finally {
    // Always release the lock
    await releaseLock(lockKey);
  }
};

/**
 * Get all bookings (Admin only)
 */
export const getAllBookings = async (options: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  showId?: string;
}) => {
  const { page = 1, limit = 20, status, userId, showId } = options;
  const skip = (page - 1) * limit;
  const cacheKey = `admin:bookings:page${page}:limit${limit}:status${status || "all"}:userId${userId || "all"}`;

  try {
    // For admin routes, we use a very short TTL to ensure data freshness
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Build where clause based on filters
    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.status = status as BookingStatus;
    }

    if (userId) {
      where.userId = userId;
    }

    if (showId) {
      where.tickets = {
        some: {
          section: {
            showtime: {
              event: {
                show: {
                  id: showId,
                },
              },
            },
          },
        },
      };
    }

    // Get total count for pagination
    const total = await prisma.booking.count({ where });

    // Get bookings with filtering
    const bookings = await prisma.booking.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        tickets: {
          take: 1,
          include: {
            section: {
              include: {
                showtime: {
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
                },
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedBookings = bookings.map((booking) =>
      formatBookingForAdmin(booking)
    );

    const result = {
      bookings: formattedBookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache with very short TTL for admin endpoints
    await setCache(cacheKey, result, 60); // 1 minute

    return result;
  } catch (error) {
    logger.error("Error getting all bookings", { error, page, limit });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to fetch bookings",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get booking statistics for admin dashboard
 */
export async function getBookingStats() {
  try {
    // Check if stats are cached
    const cacheKey = "booking:stats";
    const cachedStats = await getCache<string>(cacheKey);

    if (cachedStats) {
      return JSON.parse(cachedStats);
    }

    // Get today's date at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total number of bookings
    const totalBookings = await prisma.booking.count();

    // Get total revenue
    const revenueResult = await prisma.booking.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: "PAID",
      },
    });

    const totalRevenue = revenueResult._sum?.totalAmount?.toNumber() || 0;

    // Get bookings created today
    const todayBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Get revenue from today
    const todayRevenueResult = await prisma.booking.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: today,
        },
        status: "PAID",
      },
    });

    const todayRevenue = todayRevenueResult._sum?.totalAmount?.toNumber() || 0;

    // Get payment method distribution
    const paymentMethods = await prisma.booking.groupBy({
      by: ["paymentMethod"],
      _count: {
        paymentMethod: true,
      },
      where: {
        status: "PAID",
      },
    });

    // Get payment status distribution
    const paymentStatuses = await prisma.booking.groupBy({
      by: ["status"],
      _count: true,
    });

    const stats = {
      totalBookings,
      totalRevenue,
      todayBookings,
      todayRevenue,
      paymentMethods: paymentMethods.map((pm) => ({
        method: pm.paymentMethod,
        count: pm._count?.paymentMethod || 0,
      })),
      paymentStatuses: paymentStatuses.map((ps) => ({
        status: ps.status,
        count: ps._count || 0,
      })),
    };

    // Cache the stats for 1 hour
    await setCache(cacheKey, JSON.stringify(stats), 3600);

    return stats;
  } catch (error) {
    logger.error("Error getting booking stats:", {
      error: (error as Error).message,
    });
    throw new AppError(
      "Failed to get booking statistics",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Delete a booking (admin only)
 */
export async function deleteBooking(id: string) {
  // Get a distributed lock for this booking to prevent race conditions
  const lockKey = `booking:${id}:operation`;
  const lockAcquired = await acquireLock(lockKey, 30); // 30 second lock

  if (!lockAcquired) {
    throw new AppError(
      "System is currently processing this booking. Please try again shortly.",
      StatusCodes.CONFLICT
    );
  }

  try {
    // Start a transaction to ensure all operations succeed or fail together
    return await prisma.$transaction(async (tx) => {
      // Find the booking
      const booking = await tx.booking.findUnique({
        where: { id },
        include: {
          tickets: true,
        },
      });

      if (!booking) {
        throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
      }

      // Find the section
      const firstTicket = booking.tickets[0];
      if (firstTicket) {
        const ticket = await tx.ticket.findUnique({
          where: { id: firstTicket.id },
          select: { sectionId: true },
        });

        if (ticket) {
          const section = await tx.seatSection.findUnique({
            where: { id: ticket.sectionId },
          });

          if (section) {
            // Update available seats in the section
            await tx.seatSection.update({
              where: { id: ticket.sectionId },
              data: {
                availableSeats: section.availableSeats + booking.tickets.length,
              },
            });

            // Invalidate section cache
            await setCache(
              `section:${ticket.sectionId}:availableSeats`,
              section.availableSeats + booking.tickets.length,
              config.cache.seatAvailabilityTTL
            );
          }
        }
      }

      // Release tickets
      await Promise.all(
        booking.tickets.map(async (ticket) => {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: "AVAILABLE",
              bookings: {
                disconnect: { id: booking.id },
              },
            },
          });
        })
      );

      // Delete the booking
      await tx.booking.delete({
        where: { id },
      });

      // Invalidate caches
      await deleteCache(`booking:${id}`);
      await deleteCache(`user:${booking.userId}:bookings`);

      return { id, message: "Booking deleted successfully" };
    });
  } catch (error) {
    logger.error("Error deleting booking:", {
      error: (error as Error).message,
      id,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to delete booking",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  } finally {
    // Always release the lock
    await releaseLock(lockKey);
  }
}
