/**
 * Razorpay Integration Service
 *
 * This service handles all Razorpay payment gateway operations:
 * 1. Creating payment orders for bookings
 * 2. Verifying payment signatures
 * 3. Processing webhook notifications from Razorpay
 *
 * Integration Flow:
 * - Frontend requests an order creation for a booking
 * - Backend creates a Razorpay order and returns details
 * - User completes payment on frontend using Razorpay checkout
 * - Frontend verifies the payment with backend
 * - Backend updates booking status
 * - Razorpay also sends webhook notifications for payment events
 *
 * Required Environment Variables:
 * - RAZORPAY_KEY_ID: Your Razorpay API key ID
 * - RAZORPAY_KEY_SECRET: Your Razorpay API key secret
 * - RAZORPAY_WEBHOOK_SECRET: Secret for webhook signature verification
 */

import { StatusCodes } from "http-status-codes";
import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma, Booking, PaymentMethod, Ticket } from "@repo/database";
import { createServiceLogger } from "../utils/logger";
import { AppError } from "../utils/errors";

const logger = createServiceLogger("razorpayService");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

/**
 * Create a Razorpay order for a booking
 */
export const createOrder = async (bookingId: string) => {
  try {
    // Get the booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tickets: true },
    });

    if (!booking) {
      throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
    }

    if (booking.status !== "PENDING") {
      throw new AppError(
        `Cannot create payment for booking with status: ${booking.status}`,
        StatusCodes.BAD_REQUEST
      );
    }

    // Create Razorpay order
    const options = {
      amount: Number(booking.totalAmount) * 100, // Razorpay expects amount in paise
      currency: booking.currency,
      receipt: bookingId,
      notes: {
        bookingId: bookingId,
        userId: booking.userId,
        ticketsCount: booking.tickets.length,
      },
    };

    const order = await razorpay.orders.create(options);

    // Update booking with Razorpay order ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        razorpayOrderId: order.id,
      },
    });

    logger.info("Razorpay order created", {
      bookingId,
      orderId: order.id,
      amount: options.amount,
    });

    return {
      orderId: order.id,
      amount: options.amount,
      currency: options.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    logger.error("Error creating Razorpay order", {
      error: error instanceof Error ? error.message : "Unknown error",
      bookingId,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to create payment order",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyPayment = async (
  bookingId: string,
  paymentData: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }
): Promise<{ success: boolean; booking: Booking & { tickets: Ticket[] } }> => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      paymentData;

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError("Booking not found", StatusCodes.NOT_FOUND);
    }

    if (booking.razorpayOrderId !== razorpayOrderId) {
      throw new AppError("Order ID mismatch", StatusCodes.BAD_REQUEST);
    }

    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      throw new AppError("Invalid payment signature", StatusCodes.BAD_REQUEST);
    }

    // If validation is successful, update the booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "PAID",
        paymentMethod: "RAZORPAY" as PaymentMethod,
        paymentId: razorpayPaymentId,
        razorpaySignature: razorpaySignature,
        paymentDate: new Date(),
      },
      include: { tickets: true },
    });

    // Update tickets status to SOLD
    await Promise.all(
      updatedBooking.tickets.map(async (ticket: Ticket) => {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: "SOLD",
          },
        });
      })
    );

    logger.info("Razorpay payment verified successfully", {
      bookingId,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
    });

    return {
      success: true,
      booking: updatedBooking,
    };
  } catch (error) {
    logger.error("Error verifying Razorpay payment", {
      error: error instanceof Error ? error.message : "Unknown error",
      bookingId,
      paymentData,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to verify payment",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Handle Razorpay webhooks
 */
export const handleWebhook = async (event: any, signature: string) => {
  try {
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (!webhookSecret) {
      throw new AppError(
        "Webhook secret not configured",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    // Verify the webhook signature
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(event))
      .digest("hex");

    if (generatedSignature !== signature) {
      throw new AppError("Invalid webhook signature", StatusCodes.BAD_REQUEST);
    }

    // Handle different webhook events
    const { event: eventName, payload } = event;

    logger.info("Received Razorpay webhook", { eventName });

    if (eventName === "payment.authorized") {
      // Payment authorized - find booking by razorpayOrderId
      const { order } = payload.payment.entity;

      const booking = await prisma.booking.findFirst({
        where: { razorpayOrderId: order.entity.id },
        include: { tickets: true },
      });

      if (!booking) {
        logger.warn("Booking not found for order", {
          orderId: order.entity.id,
        });
        return { success: true };
      }

      // Update booking and tickets if not already processed
      if (booking.status !== "PAID") {
        // Update booking status
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "PAID",
            paymentMethod: "RAZORPAY" as PaymentMethod,
            paymentId: payload.payment.entity.id,
            paymentDate: new Date(),
          },
        });

        // Update tickets status to SOLD
        await Promise.all(
          booking.tickets.map(async (ticket: Ticket) => {
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: {
                status: "SOLD",
              },
            });
          })
        );

        logger.info("Payment processed from webhook", {
          bookingId: booking.id,
          paymentId: payload.payment.entity.id,
        });
      }
    } else if (eventName === "payment.failed") {
      // Payment failed - handle accordingly
      const { order } = payload.payment.entity;

      // Find the booking by razorpayOrderId
      const booking = await prisma.booking.findFirst({
        where: { razorpayOrderId: order.entity.id },
      });

      if (booking) {
        // Update booking status to reflect payment failure
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "PENDING", // Set back to PENDING so user can try again
            paymentId: payload.payment.entity.id,
          },
        });

        logger.info("Payment failure recorded", {
          bookingId: booking.id,
          paymentId: payload.payment.entity.id,
        });
      }

      logger.warn("Payment failed", {
        orderId: order.entity.id,
        paymentId: payload.payment.entity.id,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error("Error processing webhook", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to process webhook",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
