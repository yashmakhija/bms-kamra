import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";
import { config } from "../config";
import { createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("redis-queue");

// Create Redis connection for BullMQ
const redisConnection = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  password: config.redis.password,
});

redisConnection.on("error", (err) => {
  logger.error("Redis connection error in queue system", {
    error: err.message,
  });
});

// Define queues for different types of operations
export const emailQueue = new Queue("email", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100, // Keep the last 100 failed jobs
  },
});

export const reportQueue = new Queue("report", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    timeout: 300000, // 5 minutes
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

export const notificationQueue = new Queue("notification", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

export const bookingCleanupQueue = new Queue("booking-cleanup", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: 50,
  },
});

// Monitor all queues via events
const setupQueueMonitoring = (queue: Queue) => {
  const queueEvents = new QueueEvents(queue.name, {
    connection: redisConnection,
  });

  queueEvents.on("completed", ({ jobId }) => {
    logger.info(`Job ${jobId} completed in ${queue.name} queue`);
  });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    logger.error(`Job ${jobId} failed in ${queue.name} queue`, {
      queue: queue.name,
      jobId,
      reason: failedReason,
    });
  });

  queueEvents.on("error", (error) => {
    logger.error(`Error in ${queue.name} queue events`, { error });
  });
};

// Setup monitoring for all queues
setupQueueMonitoring(emailQueue);
setupQueueMonitoring(reportQueue);
setupQueueMonitoring(notificationQueue);
setupQueueMonitoring(bookingCleanupQueue);

// Email queue processor
const emailWorker = new Worker(
  "email",
  async (job) => {
    const { to, subject, text, html, metadata } = job.data;
    logger.info(`Processing email job`, {
      jobId: job.id,
      to,
      subject,
      metadata,
    });

    // In a real application, you would integrate with your email service here
    // Example: await emailService.send({ to, subject, text, html });

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 500));

    logger.info(`Email sent successfully`, { jobId: job.id, to });

    return { success: true, messageId: `email-${Date.now()}` };
  },
  { connection: redisConnection, concurrency: config.queue.concurrency }
);

// Report generation worker
const reportWorker = new Worker(
  "report",
  async (job) => {
    const { type, parameters, userId } = job.data;
    logger.info(`Processing report job`, { jobId: job.id, type, userId });

    // In a real application, you would generate reports here
    // Example: const report = await reportService.generate(type, parameters);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 5000));

    logger.info(`Report generated successfully`, {
      jobId: job.id,
      type,
      userId,
    });

    return {
      success: true,
      reportUrl: `https://example.com/reports/report-${Date.now()}.pdf`,
    };
  },
  { connection: redisConnection, concurrency: 2 } // Reports are CPU intensive, limit concurrency
);

// Notification worker
const notificationWorker = new Worker(
  "notification",
  async (job) => {
    const { userId, message, channel, data } = job.data;
    logger.info(`Processing notification job`, {
      jobId: job.id,
      userId,
      channel,
    });

    // In a real application, you would send notifications through different channels
    // Example: await notificationService.send(channel, userId, message, data);

    // Simulate notification sending
    await new Promise((resolve) => setTimeout(resolve, 300));

    logger.info(`Notification sent successfully`, {
      jobId: job.id,
      userId,
      channel,
    });

    return { success: true, notificationId: `notif-${Date.now()}` };
  },
  { connection: redisConnection, concurrency: config.queue.concurrency }
);

// Booking cleanup worker
const bookingCleanupWorker = new Worker(
  "booking-cleanup",
  async (job) => {
    const { olderThanMinutes } = job.data;
    logger.info(`Processing booking cleanup job`, {
      jobId: job.id,
      olderThanMinutes,
    });

    // In a real application, you would clean up expired bookings
    // Example: await bookingService.cleanupExpiredBookings(olderThanMinutes);

    // Simulate cleanup operation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info(`Booking cleanup completed`, { jobId: job.id });

    return { success: true, cleanedCount: Math.floor(Math.random() * 10) };
  },
  { connection: redisConnection, concurrency: 1 } // Limit to 1 for database operations
);

// Handle worker errors
emailWorker.on("error", (error) => {
  logger.error("Email worker error", { error });
});

reportWorker.on("error", (error) => {
  logger.error("Report worker error", { error });
});

notificationWorker.on("error", (error) => {
  logger.error("Notification worker error", { error });
});

bookingCleanupWorker.on("error", (error) => {
  logger.error("Booking cleanup worker error", { error });
});

// Clean up when the process exits
process.on("SIGTERM", async () => {
  await Promise.all([
    emailWorker.close(),
    reportWorker.close(),
    notificationWorker.close(),
    bookingCleanupWorker.close(),
  ]);

  logger.info("All queue workers closed");
});

process.on("SIGINT", async () => {
  await Promise.all([
    emailWorker.close(),
    reportWorker.close(),
    notificationWorker.close(),
    bookingCleanupWorker.close(),
  ]);

  logger.info("All queue workers closed");
});

/**
 * Helper function to schedule booking cleanup jobs
 * @param olderThanMinutes Minutes to use as cutoff for expired bookings
 */
export const scheduleBookingCleanup = async (olderThanMinutes: number = 20) => {
  // Add a job to the booking cleanup queue
  const job = await bookingCleanupQueue.add("cleanup-expired-bookings", {
    olderThanMinutes,
  });
  logger.info(`Scheduled booking cleanup job`, {
    jobId: job.id,
    olderThanMinutes,
  });
  return job;
};

/**
 * Helper function to send an email via the queue
 */
export const queueEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
  metadata?: any
) => {
  const job = await emailQueue.add("send-email", {
    to,
    subject,
    text,
    html,
    metadata,
  });
  logger.info(`Queued email job`, { jobId: job.id, to, subject });
  return job;
};

/**
 * Helper function to send a notification via the queue
 */
export const queueNotification = async (
  userId: string,
  message: string,
  channel: string,
  data?: any
) => {
  const job = await notificationQueue.add("send-notification", {
    userId,
    message,
    channel,
    data,
  });
  logger.info(`Queued notification job`, { jobId: job.id, userId, channel });
  return job;
};

/**
 * Helper function to generate a report via the queue
 */
export const queueReport = async (
  userId: string,
  type: string,
  parameters: any
) => {
  const job = await reportQueue.add("generate-report", {
    userId,
    type,
    parameters,
  });
  logger.info(`Queued report job`, { jobId: job.id, userId, type });
  return job;
};

export default {
  emailQueue,
  reportQueue,
  notificationQueue,
  bookingCleanupQueue,
  scheduleBookingCleanup,
  queueEmail,
  queueNotification,
  queueReport,
};
