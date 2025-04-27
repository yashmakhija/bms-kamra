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
import { LockManager } from "../utils/lockManager";
import { v4 as uuidv4 } from "uuid";

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
 * Create a new booking
 */
export async function createBooking({
  userId,
  showtimeId,
  sectionId,
  quantity,
}: {
  userId: string;
  showtimeId: string;
  sectionId: string;
  quantity: number;
}) {
  try {
    logger.info(
      `Creating booking for user ${userId}, section ${sectionId}, quantity ${quantity}`
    );

    // Validate input
    if (quantity <= 0) {
      throw new AppError("Quantity must be positive", StatusCodes.BAD_REQUEST);
    }

    // Get price information for the section
    const sectionWithPrice = await prisma.seatSection.findUnique({
      where: { id: sectionId },
      include: {
        priceTier: true,
        showtime: true,
      },
    });

    if (!sectionWithPrice) {
      throw new AppError("Section not found", StatusCodes.NOT_FOUND);
    }

    if (showtimeId !== sectionWithPrice.showtimeId) {
      throw new AppError(
        "Section does not belong to specified showtime",
        StatusCodes.BAD_REQUEST
      );
    }

    // Calculate total amount
    const price = Number(sectionWithPrice.priceTier.price);
    const totalAmount = price * quantity;
    const currency = sectionWithPrice.priceTier.currency;

    // Reserve tickets using our new concurrent-safe function
    const ticketIds = await reserveTickets(sectionId, quantity);

    // Create the booking with the reserved tickets
    const booking = await prisma.booking.create({
      data: {
        userId,
        totalAmount,
        currency,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        tickets: {
          connect: ticketIds.map((id) => ({ id })),
        },
      },
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
      },
    });

    return formatBooking(booking);
  } catch (error) {
    logger.error(`Error creating booking:`, { error });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      `Failed to create booking: ${(error as Error).message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
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

  // Log the incoming request details
  logger.info("getBookingById called", {
    bookingId: id,
    userId: userId || "none (admin access)",
    checkingPermissions: !!userId,
    timestamp: new Date().toISOString(),
  });

  try {
    // Try to get from cache first
    const cachedBooking = await getCache<any>(cacheKey);
    if (cachedBooking) {
      logger.info("getBookingById cache hit", { bookingId: id });

      // If userId is provided, check if the booking belongs to the user
      if (userId && cachedBooking.userId !== userId) {
        logger.warn("getBookingById permission denied (cached)", {
          bookingId: id,
          requestUserId: userId,
          bookingUserId: cachedBooking.userId,
          bookingStatus: cachedBooking.status || "unknown",
        });

        throw new AppError(
          "You don't have permission to view this booking",
          StatusCodes.FORBIDDEN
        );
      }

      logger.info("getBookingById returning cached booking", {
        bookingId: id,
        userPermissionCheck: userId ? "passed" : "skipped (admin)",
      });

      return cachedBooking;
    }

    // Log cache miss
    logger.info("getBookingById cache miss, fetching from DB", {
      bookingId: id,
    });

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

    // Log DB query result
    if (!booking) {
      logger.warn("getBookingById booking not found in DB", { bookingId: id });
      throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
    }

    logger.info("getBookingById DB fetch successful", {
      bookingId: id,
      bookingStatus: booking.status,
      bookingUserId: booking.userId,
      requestUserId: userId || "none (admin access)",
      ticketsCount: booking.tickets.length,
    });

    // If userId is provided, check if the booking belongs to the user
    if (userId && booking.userId !== userId) {
      logger.warn("getBookingById permission denied (DB)", {
        bookingId: id,
        requestUserId: userId,
        bookingUserId: booking.userId,
        bookingStatus: booking.status,
      });

      throw new AppError(
        "You don't have permission to view this booking",
        StatusCodes.FORBIDDEN
      );
    }

    // Format the booking
    const formattedBooking = userId
      ? formatBooking(booking)
      : formatBookingForAdmin(booking);

    // Log the formatted booking userId information
    if (formattedBooking) {
      logger.info("getBookingById booking formatted with userId check", {
        bookingId: id,
        originalUserId: booking.userId,
        formattedUserId: formattedBooking.userId,
        matches: formattedBooking.userId === booking.userId,
      });
    }

    // Log the success path
    logger.info("getBookingById booking formatted", {
      bookingId: id,
      formatter: userId ? "user" : "admin",
      userPermissionCheck: userId ? "passed" : "skipped (admin)",
    });

    // Cache the formatted booking
    if (booking) {
      // Cache the result (short TTL for bookings)
      await setCache(cacheKey, formattedBooking, 300); // 5 minutes
      logger.info("getBookingById booking cached", { bookingId: id });
    }

    return formattedBooking;
  } catch (error) {
    // Enhanced error logging with more context
    logger.error("Error getting booking by ID", {
      error,
      bookingId: id,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorType:
        error instanceof AppError
          ? "AppError"
          : error && typeof error === "object"
            ? (error as any).constructor?.name
            : "Unknown",
      userId: userId || "none (admin access)",
    });

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

/**
 * Reserve tickets for a booking
 * Uses distributed locking to prevent race conditions
 */
export async function reserveTickets(
  sectionId: string,
  quantity: number
): Promise<string[]> {
  // Use our new LockManager to handle distributed locking
  const resourceKey = `section:${sectionId}:reservation`;

  const result = await LockManager.withLock<string[]>(
    resourceKey,
    async () => {
      // Check available tickets under the lock
      const section = await prisma.seatSection.findUnique({
        where: { id: sectionId },
      });

      if (!section) {
        throw new AppError("Seat section not found", StatusCodes.NOT_FOUND);
      }

      if (section.availableSeats < quantity) {
        throw new AppError(
          `Not enough available seats. Requested: ${quantity}, Available: ${section.availableSeats}`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Find available tickets
      const availableTickets = await prisma.ticket.findMany({
        where: {
          sectionId,
          status: {
            in: ["AVAILABLE", "CANCELED"],
          },
        },
        take: quantity,
      });

      if (availableTickets.length < quantity) {
        throw new AppError(
          `Not enough available tickets. Requested: ${quantity}, Found: ${availableTickets.length}`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Update tickets atomically within the lock
      const ticketIds = availableTickets.map((ticket) => ticket.id);

      // Mark tickets as reserved in a single transaction
      await prisma.$transaction([
        // Update ticket status
        prisma.ticket.updateMany({
          where: {
            id: { in: ticketIds },
            status: "AVAILABLE", // Extra verification of status
          },
          data: {
            status: "RESERVED",
          },
        }),
        // Update available seats count
        prisma.seatSection.update({
          where: { id: sectionId },
          data: {
            availableSeats: {
              decrement: quantity,
            },
          },
        }),
      ]);

      logger.info(`Reserved ${quantity} tickets for section ${sectionId}`);
      return ticketIds;
    },
    {
      ttlMs: 10000, // 10 seconds should be enough for the reservation
      retryCount: 3, // Try 3 times before giving up
      retryDelayMs: 300, // Wait 300ms between retries
    }
  );

  if (!result) {
    throw new AppError(
      "Unable to reserve tickets due to high concurrency. Please try again.",
      StatusCodes.CONFLICT
    );
  }

  return result;
}
