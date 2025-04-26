import cron from "node-cron";
import { bookingQueue, ticketQueue, notificationQueue } from "../lib/queue";
import { getDbClient } from "../lib/database";
import { createServiceLogger } from "../utils/logger";
import { BookingStatus } from "@repo/database";
import { config } from "../config";

const logger = createServiceLogger("scheduler-worker");

// Scheduler initialization function
export function initializeScheduler() {
  logger.info("Starting task scheduler");

  // Schedule expired bookings check - Every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      logger.info("Scheduling expired bookings cleanup");
      await bookingQueue.add(
        "check-expired-bookings",
        { batchSize: 200 },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 60000, // 1 minute
          },
          jobId: `expired-bookings-${Date.now()}`,
        }
      );
    } catch (error) {
      logger.error("Failed to schedule expired bookings cleanup:", {
        error: (error as Error).message,
      });
    }
  });

  // Schedule ticket lock cleanup - Every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      const now = new Date();
      logger.info("Cleaning up expired ticket locks");

      // Find expired locks
      const expiredLocks = await getDbClient("read").ticketLock.findMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
        select: {
          ticketId: true,
          userId: true,
        },
        take: 500, // Process in batches
      });

      if (expiredLocks.length === 0) {
        logger.info("No expired ticket locks found");
        return;
      }

      logger.info(
        `Found ${expiredLocks.length} expired ticket locks to clean up`
      );

      // Group by user for efficient processing
      const locksByUser = expiredLocks.reduce(
        (grouped, lock) => {
          if (!grouped[lock.userId]) {
            grouped[lock.userId] = [];
          }
          grouped[lock.userId]?.push(lock.ticketId);
          return grouped;
        },
        {} as Record<string, string[]>
      );

      // Create release jobs for each user's tickets
      for (const [userId, ticketIds] of Object.entries(locksByUser)) {
        await ticketQueue.add(
          "release-tickets",
          {
            ticketIds,
            userId,
            source: "scheduler-cleanup",
          },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 10000, // 10 seconds
            },
            jobId: `lock-cleanup-${userId}-${Date.now()}`,
          }
        );
      }
    } catch (error) {
      logger.error("Failed to clean up expired ticket locks:", {
        error: (error as Error).message,
      });
    }
  });

  // Schedule upcoming event reminders - Once per hour
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      // Look for events happening in next 24 hours
      const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      logger.info("Scheduling event reminders");

      // Find upcoming events
      const upcomingEvents = await getDbClient("read").event.findMany({
        where: {
          date: {
            gte: now,
            lte: reminderTime,
          },
          isActive: true,
        },
        select: {
          id: true,
          date: true,
          show: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      logger.info(
        `Found ${upcomingEvents.length} upcoming events for reminders`
      );

      // Schedule reminders for each event
      for (const event of upcomingEvents) {
        const hoursUntilEvent = Math.round(
          (event.date.getTime() - now.getTime()) / (60 * 60 * 1000)
        );

        await notificationQueue.add(
          "send-event-reminder",
          {
            eventId: event.id,
            showId: event.show.id,
            showTitle: event.show.title,
            eventDate: event.date,
            hoursBeforeEvent: hoursUntilEvent,
          },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 10000, // 10 seconds
            },
            jobId: `event-reminder-${event.id}-${Date.now()}`,
          }
        );
      }
    } catch (error) {
      logger.error("Failed to schedule event reminders:", {
        error: (error as Error).message,
      });
    }
  });

  // Schedule database stats collection - Every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    try {
      logger.info("Collecting database statistics");

      // This would collect stats on bookings, ticket sales, etc.
      // In a real implementation, you would store these in a time-series database
      // or analytics table for dashboards

      // For now, we'll just log that we would collect stats
      logger.info("[MOCK] Database statistics collection task executed");
    } catch (error) {
      logger.error("Failed to collect database statistics:", {
        error: (error as Error).message,
      });
    }
  });

  // Schedule cache pruning - Every day at 2 AM
  cron.schedule("0 2 * * *", async () => {
    try {
      logger.info("Pruning old cache entries");

      // In a real implementation, you would call a cache service to clean up old entries
      // For now, we'll just log that we would do this
      logger.info("[MOCK] Cache pruning task executed");
    } catch (error) {
      logger.error("Failed to prune cache:", {
        error: (error as Error).message,
      });
    }
  });

  // Log successful scheduler initialization
  logger.info("Task scheduler initialized successfully");
}

// Export the initialization function
export default { initializeScheduler };
