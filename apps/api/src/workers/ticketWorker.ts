import { Job } from "bull";
import { ticketQueue } from "../lib/queue";
import { prisma } from "../lib/database";
import { createServiceLogger } from "../utils/logger";
import { LockManager } from "../utils/lockManager";
import * as cacheService from "../utils/advancedCache";
import { config } from "../config";

const logger = createServiceLogger("ticket-worker");

// Process ticket reservation jobs
ticketQueue.process("reserve-tickets", async (job: Job) => {
  const { sectionId, quantity, userId, bookingId } = job.data;
  logger.info(`Processing ticket reservation job ${job.id}`, {
    sectionId,
    quantity,
    userId,
  });

  try {
    // Acquire distributed lock for this operation
    const lockToken = await LockManager.acquireLock(
      `section:${sectionId}:reserve`,
      30000 // 30 seconds lock timeout
    );

    if (!lockToken) {
      throw new Error(`Could not acquire lock for section ${sectionId}`);
    }

    try {
      // Get section with available seats
      const section = await prisma.seatSection.findUnique({
        where: { id: sectionId },
        select: { id: true, availableSeats: true, priceTierId: true },
      });

      if (!section) {
        throw new Error(`Section ${sectionId} not found`);
      }

      if (section.availableSeats < quantity) {
        throw new Error(
          `Not enough available seats in section ${sectionId}. Requested: ${quantity}, Available: ${section.availableSeats}`
        );
      }

      // Get pricing information
      const priceTier = await prisma.priceTier.findUnique({
        where: { id: section.priceTierId },
        select: { price: true, currency: true },
      });

      if (!priceTier) {
        throw new Error(`Price tier not found for section ${sectionId}`);
      }

      // Find available tickets in this section
      const tickets = await prisma.ticket.findMany({
        where: {
          sectionId,
          status: "AVAILABLE",
        },
        take: quantity,
      });

      if (tickets.length < quantity) {
        throw new Error(
          `Not enough tickets available in section ${sectionId}. Requested: ${quantity}, Found: ${tickets.length}`
        );
      }

      // Lock tickets for this user
      const ticketIds = tickets.map((ticket) => ticket.id);

      // Update tickets status to LOCKED
      await prisma.ticket.updateMany({
        where: {
          id: { in: ticketIds },
        },
        data: {
          status: "LOCKED",
        },
      });

      // Create ticket locks
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await prisma.$transaction(
        ticketIds.map((ticketId) =>
          prisma.ticketLock.create({
            data: {
              ticketId,
              userId,
              expiresAt: expiryTime,
            },
          })
        )
      );

      // Update available seats count
      await prisma.seatSection.update({
        where: { id: sectionId },
        data: {
          availableSeats: {
            decrement: quantity,
          },
        },
      });

      // Update booking with ticket info if bookingId is provided
      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            tickets: {
              connect: ticketIds.map((id) => ({ id })),
            },
          },
        });
      }

      // Invalidate caches
      await cacheService.invalidateCachePattern(`section:${sectionId}`);

      return {
        success: true,
        ticketIds,
        expiresAt: expiryTime,
      };
    } finally {
      // Release the lock
      await LockManager.releaseLock(`section:${sectionId}:reserve`, lockToken);
    }
  } catch (error) {
    logger.error(`Error in ticket reservation job ${job.id}:`, {
      error: (error as Error).message,
      jobData: job.data,
    });
    throw error;
  }
});

// Process ticket release jobs
ticketQueue.process("release-tickets", async (job: Job) => {
  const { ticketIds, userId } = job.data;
  logger.info(`Processing ticket release job ${job.id}`, {
    ticketIds,
    userId,
  });

  try {
    // Get sections affected by these tickets for caching
    const tickets = await prisma.ticket.findMany({
      where: {
        id: { in: ticketIds },
      },
      select: { id: true, sectionId: true },
    });

    const sectionIds = [...new Set(tickets.map((t) => t.sectionId))];

    // Acquire locks for all sections
    const lockTokens = await Promise.all(
      sectionIds.map((id) =>
        LockManager.acquireLock(`section:${id}:release`, 30000)
      )
    );

    if (lockTokens.some((token) => token === null)) {
      throw new Error(
        `Could not acquire locks for all sections: ${sectionIds.join(", ")}`
      );
    }

    try {
      // Delete ticket locks
      await prisma.ticketLock.deleteMany({
        where: {
          ticketId: { in: ticketIds },
          userId,
        },
      });

      // Update tickets back to AVAILABLE
      await prisma.ticket.updateMany({
        where: {
          id: { in: ticketIds },
          status: "LOCKED",
        },
        data: {
          status: "AVAILABLE",
        },
      });

      // Update seat counts for affected sections
      const sectionCounts = tickets.reduce(
        (counts, ticket) => {
          counts[ticket.sectionId] = (counts[ticket.sectionId] || 0) + 1;
          return counts;
        },
        {} as Record<string, number>
      );

      await Promise.all(
        Object.entries(sectionCounts).map(([sectionId, count]) =>
          prisma.seatSection.update({
            where: { id: sectionId },
            data: {
              availableSeats: {
                increment: count,
              },
            },
          })
        )
      );

      // Invalidate caches for all affected sections
      await Promise.all(
        sectionIds.map((id) =>
          cacheService.invalidateCachePattern(`section:${id}`)
        )
      );

      return {
        success: true,
        releasedCount: ticketIds.length,
      };
    } finally {
      // Release all locks
      await Promise.all(
        sectionIds.map((id, index) =>
          LockManager.releaseLock(`section:${id}:release`, lockTokens[index]!)
        )
      );
    }
  } catch (error) {
    logger.error(`Error in ticket release job ${job.id}:`, {
      error: (error as Error).message,
      jobData: job.data,
    });
    throw error;
  }
});

// Initialize the queue
ticketQueue.on("ready", () => {
  logger.info("Ticket queue is ready");
});

ticketQueue.on("error", (error) => {
  logger.error("Ticket queue error:", { error: error.message });
});

// Handle completed jobs
ticketQueue.on("completed", (job) => {
  logger.info(`Ticket job ${job.id} completed successfully`);
});

// Log failed jobs
ticketQueue.on("failed", (job, error) => {
  logger.error(`Ticket job ${job?.id} failed:`, {
    error: error.message,
    jobData: job?.data,
  });
});

// Export the queue for use in other files
export default ticketQueue;
