import { Job } from "bull";
import { paymentQueue, notificationQueue } from "../lib/queue";
import { getDbClient, prisma } from "../lib/database";
import { createServiceLogger } from "../utils/logger";
import * as cacheService from "../utils/advancedCache";
import { BookingStatus, PaymentMethod } from "@repo/database";
import { AppError } from "../utils/errors";
import { StatusCodes } from "http-status-codes";
import RazorpayClient from "../lib/razorpay";

const logger = createServiceLogger("payment-worker");

// Process payment verification
paymentQueue.process("verify-payment", async (job: Job) => {
  const { bookingId, paymentId, paymentMethod, paymentData } = job.data;
  logger.info(`Processing payment verification job ${job.id}`, {
    bookingId,
    paymentMethod,
  });

  try {
    // 1. Get booking
    const booking = await getDbClient("read").booking.findUnique({
      where: { id: bookingId },
      include: {
        tickets: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError(
        `Invalid booking status: ${booking.status}. Expected: PENDING`,
        StatusCodes.BAD_REQUEST
      );
    }

    let isPaymentVerified = false;

    // 2. Verify payment based on payment method
    if (paymentMethod === PaymentMethod.RAZORPAY) {
      // Verify Razorpay payment
      const razorpay = RazorpayClient.getInstance();
      try {
        const { signature, orderId } = paymentData;
        isPaymentVerified = await razorpay.verifyPayment(
          orderId,
          paymentId,
          signature
        );
      } catch (error) {
        logger.error(`Razorpay verification failed for booking ${bookingId}:`, {
          error: (error as Error).message,
        });
        throw new AppError(
          "Payment verification failed",
          StatusCodes.BAD_REQUEST
        );
      }
    } else {
      // For other payment methods, simulate verification (in real-world would integrate with payment provider APIs)
      isPaymentVerified = true;
    }

    if (!isPaymentVerified) {
      throw new AppError(
        "Payment verification failed",
        StatusCodes.BAD_REQUEST
      );
    }

    // 3. Update booking with payment info
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.PAID,
        paymentMethod,
        paymentId,
        paymentDate: new Date(),
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
                        show: true,
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

    // 4. Update tickets to RESERVED status
    await prisma.ticket.updateMany({
      where: {
        id: { in: booking.tickets.map((t) => t.id) },
      },
      data: {
        status: "RESERVED",
      },
    });

    // 5. Invalidate caches
    await cacheService.invalidateCachePattern(`booking:${bookingId}`);
    await cacheService.invalidateCachePattern(
      `user:${booking.userId}:bookings`
    );

    // 6. Add notification job for successful payment
    await notificationQueue.add("send-booking-confirmation", {
      booking: updatedBooking,
      user: booking.user,
    });

    logger.info(`Payment verified successfully for booking ${bookingId}`);

    return {
      success: true,
      bookingId,
      status: BookingStatus.PAID,
      paymentMethod,
      paymentDate: updatedBooking.paymentDate,
    };
  } catch (error) {
    logger.error(`Error in payment verification job ${job.id}:`, {
      error: (error as Error).message,
      jobData: job.data,
    });
    throw error;
  }
});

// Process payment refund
paymentQueue.process("process-refund", async (job: Job) => {
  const { bookingId, reason, adminId } = job.data;
  logger.info(`Processing refund job ${job.id}`, {
    bookingId,
    adminId,
  });

  try {
    // 1. Get booking
    const booking = await getDbClient("read").booking.findUnique({
      where: { id: bookingId },
      include: {
        tickets: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
    }

    if (booking.status !== BookingStatus.PAID) {
      throw new AppError(
        `Cannot refund booking with status: ${booking.status}. Expected: PAID`,
        StatusCodes.BAD_REQUEST
      );
    }

    // 2. Process refund based on payment method
    let refundId = "";

    if (booking.paymentMethod === PaymentMethod.RAZORPAY && booking.paymentId) {
      // Initiate Razorpay refund
      const razorpay = RazorpayClient.getInstance();
      try {
        const result = await razorpay.refundPayment(booking.paymentId, {
          amount: Number(booking.totalAmount) * 100, // convert to lowest currency unit
          notes: {
            reason: reason || "Customer requested refund",
            bookingId: bookingId,
            adminId: adminId || "system",
          },
        });
        refundId = result.id;
      } catch (error) {
        logger.error(`Razorpay refund failed for booking ${bookingId}:`, {
          error: (error as Error).message,
        });
        throw new AppError("Refund processing failed", StatusCodes.BAD_REQUEST);
      }
    } else {
      // For other payment methods, simulate refund with a generated ID
      refundId = `manual-refund-${Date.now()}`;
    }

    // 3. Update booking status with dedicated refund fields
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REFUNDED,
        refundId: refundId,
        refundDate: new Date(),
        refundReason: reason || "Customer requested refund",
        refundedBy: adminId || "system",
      },
    });

    // 4. Release tickets
    const ticketIds = booking.tickets.map((ticket) => ticket.id);
    await prisma.ticket.updateMany({
      where: {
        id: { in: ticketIds },
      },
      data: {
        status: "AVAILABLE",
      },
    });

    // 5. Update seat section counts
    const ticketsWithSections = await getDbClient("read").ticket.findMany({
      where: {
        id: { in: ticketIds },
      },
      select: {
        sectionId: true,
      },
    });

    // Count tickets by section
    const sectionCounts = ticketsWithSections.reduce(
      (counts, ticket) => {
        counts[ticket.sectionId] = (counts[ticket.sectionId] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );

    // Update section available seats
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

    // 6. Invalidate caches
    await cacheService.invalidateCachePattern(`booking:${bookingId}`);
    await cacheService.invalidateCachePattern(
      `user:${booking.userId}:bookings`
    );
    Object.keys(sectionCounts).forEach((sectionId) => {
      cacheService.invalidateCachePattern(`section:${sectionId}`);
    });

    // 7. Add notification job for refund
    await notificationQueue.add("send-refund-notification", {
      booking: updatedBooking,
      user: booking.user,
      refundId,
      reason,
    });

    logger.info(`Refund processed successfully for booking ${bookingId}`);

    return {
      success: true,
      bookingId,
      refundId,
      status: BookingStatus.REFUNDED,
    };
  } catch (error) {
    logger.error(`Error in refund job ${job.id}:`, {
      error: (error as Error).message,
      jobData: job.data,
    });
    throw error;
  }
});

// Initialize the queue
paymentQueue.on("ready", () => {
  logger.info("Payment queue is ready");
});

paymentQueue.on("error", (error) => {
  logger.error("Payment queue error:", { error: error.message });
});

// Handle completed jobs
paymentQueue.on("completed", (job) => {
  logger.info(`Payment job ${job.id} completed successfully`);
});

// Log failed jobs
paymentQueue.on("failed", (job, error) => {
  logger.error(`Payment job ${job?.id} failed:`, {
    error: error.message,
    jobData: job?.data,
  });
});

// Export the queue for use in other files
export default paymentQueue;
