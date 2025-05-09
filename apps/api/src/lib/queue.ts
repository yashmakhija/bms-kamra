import Bull from "bull";
import { config } from "../config";
import { createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("queue-service");

// Configure Redis connection options
const redisConfig = {
  redis: {
    port: config.redis.port,
    host: config.redis.host,
    password: config.redis.password,
    tls: config.redis.useTLS ? {} : undefined,
    db: config.redis.db || 0,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100, // Keep only 100 completed jobs
    removeOnFail: 200, // Keep only 200 failed jobs
  },
};

// Create queues for different tasks
export const bookingQueue = new Bull("booking-queue", redisConfig);
export const ticketQueue = new Bull("ticket-queue", redisConfig);
export const paymentQueue = new Bull("payment-queue", redisConfig);
export const notificationQueue = new Bull("notification-queue", redisConfig);

// Global error handler for all queues
const registerQueueErrorHandlers = (queue: Bull.Queue) => {
  queue.on("error", (error) => {
    logger.error(`Queue ${queue.name} error:`, {
      error: error.message,
      stack: error.stack,
    });
  });

  queue.on("failed", (job, error) => {
    logger.error(`Job ${job.id} in queue ${queue.name} failed:`, {
      error: error.message,
      stack: error.stack,
      jobData: job.data,
      attempts: job.attemptsMade,
    });
  });

  queue.on("stalled", (jobId) => {
    logger.warn(`Job ${jobId} in queue ${queue.name} stalled`, { jobId });
  });
};

// Register error handlers for all queues
registerQueueErrorHandlers(bookingQueue);
registerQueueErrorHandlers(ticketQueue);
registerQueueErrorHandlers(paymentQueue);
registerQueueErrorHandlers(notificationQueue);

logger.info("Queue system initialized");

export default {
  bookingQueue,
  ticketQueue,
  paymentQueue,
  notificationQueue,
};
