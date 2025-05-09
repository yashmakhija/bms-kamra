import { Job } from "bull";
import { bookingQueue, ticketQueue } from "../lib/queue";
import { getDbClient, prisma } from "../lib/database";
import { createServiceLogger } from "../utils/logger";
import * as cacheService from "../utils/advancedCache";
import { TicketStatus, BookingStatus } from "@repo/database";
import { AppError } from "../utils/errors";
import { StatusCodes } from "http-status-codes";

const logger = createServiceLogger("booking-worker");

// Process booking creation
bookingQueue.process("create-booking", async (job: Job) => {
  const { userId, showtimeId, sectionId, quantity } = job.data;
  logger.info(`Processing booking creation job ${job.id}`, {
    userId,
    showtimeId,
    sectionId,
    quantity,
  });

  try {
    // 1. Get price information for the section
    const sectionWithPrice = await getDbClient("read").seatSection.findUnique({
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

    // 2. Calculate total amount
    const price = Number(sectionWithPrice.priceTier.price);
    const totalAmount = price * quantity;
    const currency = sectionWithPrice.priceTier.currency;

    // 3. Create booking with PENDING status
    const booking = await prisma.booking.create({
      data: {
        userId,
        totalAmount,
        currency,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // 4. Add job to reserve tickets
    await ticketQueue.add(
      "reserve-tickets",
      {
        sectionId,
        quantity,
        userId,
        bookingId: booking.id,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );

    logger.info(
      `Booking created with ID ${booking.id}, tickets reservation queued`
    );

    return {
      bookingId: booking.id,
      totalAmount,
      currency,
      expiresAt: booking.expiresAt,
    };
  } catch (error) {
    logger.error(`Error in booking creation job ${job.id}:`, {
      error: (error as Error).message,
      jobData: job.data,
    });
    throw error;
  }
});

// Process booking cancellation
bookingQueue.process("cancel-booking", async (job: Job) => {
  const { bookingId, userId } = job.data;
  logger.info(`Processing booking cancellation job ${job.id}`, {
    bookingId,
    userId,
  });

  try {
    // 1. Get booking with tickets
    const booking = await getDbClient("read").booking.findUnique({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        tickets: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
    }

    if (booking.status === "PAID") {
      throw new AppError(
        "Cannot cancel a paid booking, use refund instead",
        StatusCodes.BAD_REQUEST
      );
    }

    // 2. Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELED",
      },
    });

    // 3. Release tickets
    const ticketIds = booking.tickets.map((ticket) => ticket.id);
    if (ticketIds.length > 0) {
      await ticketQueue.add(
        "release-tickets",
        {
          ticketIds,
          userId,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        }
      );
    }

    // 4. Invalidate cache for this booking
    await cacheService.invalidateCachePattern(`booking:${bookingId}`);
    await cacheService.invalidateCachePattern(`user:${userId}:bookings`);

    logger.info(`Booking ${bookingId} cancelled, tickets release queued`);

    return {
      success: true,
      bookingId,
      status: "CANCELED",
    };
  } catch (error) {
    logger.error(`Error in booking cancellation job ${job.id}:`, {
      error: (error as Error).message,
      jobData: job.data,
    });
    throw error;
  }
});

// Process bookings expiration check
bookingQueue.process("check-expired-bookings", async (job: Job) => {
  const { batchSize = 100 } = job.data;
  logger.info(`Processing booking expiration check job ${job.id}`, {
    batchSize,
  });

  try {
    // Find expired pending bookings
    const now = new Date();
    const expiredBookings = await getDbClient("read").booking.findMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lt: now,
        },
      },
      include: {
        tickets: true,
      },
      take: batchSize,
    });

    logger.info(`Found ${expiredBookings.length} expired bookings to process`);

    // Process each expired booking
    const results = await Promise.allSettled(
      expiredBookings.map(async (booking) => {
        try {
          // Update booking status
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: "EXPIRED",
            },
          });

          // Release tickets
          const ticketIds = booking.tickets.map((ticket) => ticket.id);
          if (ticketIds.length > 0) {
            await ticketQueue.add(
              "release-tickets",
              {
                ticketIds,
                userId: booking.userId,
              },
              {
                attempts: 3,
                backoff: {
                  type: "exponential",
                  delay: 2000,
                },
              }
            );
          }

          // Invalidate cache
          await cacheService.invalidateCachePattern(`booking:${booking.id}`);
          await cacheService.invalidateCachePattern(
            `user:${booking.userId}:bookings`
          );

          return {
            success: true,
            bookingId: booking.id,
            ticketsReleased: ticketIds.length,
          };
        } catch (error) {
          logger.error(`Error processing expired booking ${booking.id}:`, {
            error: (error as Error).message,
          });
          return {
            success: false,
            bookingId: booking.id,
            error: (error as Error).message,
          };
        }
      })
    );

    return {
      processed: expiredBookings.length,
      succeeded: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
      details: results,
    };
  } catch (error) {
    logger.error(`Error in booking expiration check job ${job.id}:`, {
      error: (error as Error).message,
      jobData: job.data,
    });
    throw error;
  }
});

// Initialize the queue
bookingQueue.on("ready", () => {
  logger.info("Booking queue is ready");
});

bookingQueue.on("error", (error) => {
  logger.error("Booking queue error:", { error: error.message });
});

// Handle completed jobs
bookingQueue.on("completed", (job) => {
  logger.info(`Booking job ${job.id} completed successfully`);
});

// Log failed jobs
bookingQueue.on("failed", (job, error) => {
  logger.error(`Booking job ${job?.id} failed:`, {
    error: error.message,
    jobData: job?.data,
  });
});

// Export the queue for use in other files
export default bookingQueue;
