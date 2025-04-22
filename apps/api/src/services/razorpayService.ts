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
import { createHmac } from "crypto";
import { prisma, Booking, PaymentMethod, Ticket } from "@repo/database";
import { createServiceLogger } from "../utils/logger";
import { AppError } from "../utils/errors";
import { LockManager } from "../utils/lockManager";
import { BookingWithDetails } from "../types";

const logger = createServiceLogger("razorpay-service");

// Initialize Razorpay instance with timeout and retry options
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Check if Razorpay is properly configured
const isRazorpayConfigured = (): boolean => {
  const isConfigured = !!(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_WEBHOOK_SECRET
  );

  if (!isConfigured) {
    logger.warn("Razorpay is not fully configured. Some operations may fail.");
  }

  return isConfigured;
};

// Initialize during service startup
const initialized = isRazorpayConfigured();

/**
 * Create a Razorpay order for a booking
 * @param booking Booking details
 * @param options Additional options
 * @returns Razorpay order details
 */
export async function createOrder(
  booking: BookingWithDetails,
  options: {
    notes?: Record<string, string>;
    retryCount?: number;
  } = {}
): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  if (!initialized) {
    logger.error("Razorpay not properly configured for createOrder", {
      keyId: process.env.RAZORPAY_KEY_ID ? "Set" : "Not set",
      keySecret: process.env.RAZORPAY_KEY_SECRET ? "Set" : "Not set",
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ? "Set" : "Not set",
    });
    throw new AppError(
      "Payment gateway is not properly configured",
      StatusCodes.SERVICE_UNAVAILABLE
    );
  }

  const { notes = {}, retryCount = 2 } = options;
  const bookingId = booking.id;

  // Use our lock manager to prevent duplicate orders
  const lockKey = `razorpay:order:${bookingId}`;

  const result = await LockManager.withLock<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }>(
    lockKey,
    async () => {
      let lastError: Error | null = null;

      // Implementation with retries
      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          if (attempt > 0) {
            logger.info(
              `Retrying Razorpay order creation for booking ${bookingId} (attempt ${attempt})`
            );
          }

          // Convert amount to paise (multiply by 100)
          const amountInPaise = Math.round(Number(booking.totalAmount) * 100);

          // Add booking reference in notes
          const orderNotes = {
            ...notes,
            bookingId,
            userId: booking.userId,
          };

          logger.info(`Attempting to create Razorpay order`, {
            bookingId,
            amount: amountInPaise,
            currency: booking.currency || "INR",
          });

          // Create the order - await the Promise to get the actual order object
          const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: booking.currency || "INR",
            receipt: `booking_${bookingId}`,
            notes: orderNotes,
            payment_capture: true, // Use boolean instead of number
          });

          logger.info(`Created Razorpay order for booking ${bookingId}`, {
            orderId: order.id,
            amount: amountInPaise,
          });

          if (!order || !order.id) {
            throw new Error("Razorpay order creation failed: Invalid response");
          }

          // Update booking with order ID
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentId: order.id,
            },
          });

          return {
            orderId: order.id,
            amount: amountInPaise,
            currency: booking.currency || "INR",
            keyId: process.env.RAZORPAY_KEY_ID || "",
          };
        } catch (error) {
          lastError = error as Error;

          // Log the error with detailed information
          logger.error(`Razorpay order creation failed (attempt ${attempt})`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            bookingId,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID ? "Set" : "Not set",
          });

          // Only retry on network errors or server errors
          const errorMsg = String(error).toLowerCase();
          const shouldRetry =
            errorMsg.includes("network") ||
            errorMsg.includes("timeout") ||
            errorMsg.includes("econnrefused") ||
            errorMsg.includes("5") || // 5xx errors
            errorMsg.includes("server error");

          if (!shouldRetry) {
            break;
          }

          // Wait before retry with exponential backoff
          if (attempt < retryCount) {
            const delayMs = Math.min(Math.pow(2, attempt) * 500, 5000);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      // If we get here, all retries failed
      throw new AppError(
        `Failed to create payment order: ${lastError?.message || "Unknown error"}`,
        StatusCodes.SERVICE_UNAVAILABLE
      );
    },
    {
      ttlMs: 30000, // 30 seconds lock
      retryCount: 2, // Try to get the lock twice
    }
  );

  if (!result) {
    throw new AppError(
      "Could not acquire lock for order creation",
      StatusCodes.CONFLICT
    );
  }

  return result;
}

/**
 * Verify a Razorpay payment signature
 * @param params Payment verification parameters
 * @returns Whether the signature is valid
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  if (!initialized) {
    logger.error(
      "Razorpay not properly configured for signature verification",
      {
        keyId: process.env.RAZORPAY_KEY_ID ? "Set" : "Not set",
        keySecret: process.env.RAZORPAY_KEY_SECRET ? "Set" : "Not set",
      }
    );
    return false;
  }

  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

    // Validate inputs
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      logger.warn("Missing required parameters for signature verification", {
        hasOrderId: !!razorpayOrderId,
        hasPaymentId: !!razorpayPaymentId,
        hasSignature: !!razorpaySignature,
      });
      return false;
    }

    // Generate the signature to verify
    const hmac = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");

    const data = `${razorpayOrderId}|${razorpayPaymentId}`;
    hmac.update(data);
    const expectedSignature = hmac.digest("hex");

    // Check if signatures match
    const isValid = expectedSignature === razorpaySignature;

    if (!isValid) {
      logger.warn("Invalid Razorpay signature", {
        razorpayOrderId,
        razorpayPaymentId,
        expectedLength: expectedSignature.length,
        receivedLength: razorpaySignature.length,
      });
    } else {
      logger.info("Razorpay payment signature verified successfully", {
        razorpayOrderId,
        razorpayPaymentId,
      });
    }

    return isValid;
  } catch (error) {
    logger.error("Error verifying Razorpay signature", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * Verify a webhook signature from Razorpay
 * @param payload Raw webhook payload
 * @param signature Webhook signature from headers
 * @returns Whether the signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!initialized || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    logger.error(
      "Webhook verification failed: Razorpay webhook secret not configured"
    );
    return false;
  }

  try {
    // Compute expected signature
    const expectedSignature = createHmac(
      "sha256",
      process.env.RAZORPAY_WEBHOOK_SECRET
    )
      .update(payload)
      .digest("hex");

    // Compare expected and actual signatures
    const isValid = expectedSignature === signature;

    if (!isValid) {
      logger.warn("Invalid Razorpay webhook signature");
    }

    return isValid;
  } catch (error) {
    logger.error("Error verifying Razorpay webhook signature", {
      error: (error as Error).message,
    });
    return false;
  }
}

/**
 * Get payment details from Razorpay
 * @param paymentId Razorpay payment ID
 * @returns Payment details
 */
export async function getPaymentDetails(paymentId: string): Promise<any> {
  if (!initialized) {
    throw new AppError(
      "Payment gateway is not properly configured",
      StatusCodes.SERVICE_UNAVAILABLE
    );
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    logger.error(`Error fetching payment details for ${paymentId}`, {
      error: (error as Error).message,
    });
    throw new AppError(
      `Failed to fetch payment details: ${(error as Error).message}`,
      StatusCodes.SERVICE_UNAVAILABLE
    );
  }
}

/**
 * Process webhook notification from Razorpay
 * @param payload Webhook payload
 * @returns Processing result
 */
export async function processWebhook(payload: any): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!payload || !payload.event) {
      return { success: false, message: "Invalid webhook payload" };
    }

    const event = payload.event;
    logger.info(`Processing Razorpay webhook: ${event}`, {
      paymentId: payload.payload?.payment?.entity?.id,
      orderId: payload.payload?.order?.entity?.id,
    });

    switch (event) {
      case "payment.authorized":
        await handlePaymentAuthorized(payload.payload.payment.entity);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload.payload.payment.entity);
        break;
      case "order.paid":
        await handleOrderPaid(payload.payload.order.entity);
        break;
      case "refund.created":
        await handleRefundCreated(payload.payload.refund.entity);
        break;
      default:
        logger.info(`Unhandled Razorpay webhook event: ${event}`);
    }

    return {
      success: true,
      message: `Webhook ${event} processed successfully`,
    };
  } catch (error) {
    logger.error("Error processing Razorpay webhook:", {
      error: (error as Error).message,
    });
    return {
      success: false,
      message: `Webhook processing error: ${(error as Error).message}`,
    };
  }
}

/**
 * Handle payment.authorized event
 * @param payment Payment details from webhook
 */
async function handlePaymentAuthorized(payment: any): Promise<void> {
  try {
    const orderId = payment.order_id;
    const paymentId = payment.id;

    // Find booking by order ID
    const booking = await prisma.booking.findFirst({
      where: { paymentId: orderId },
    });

    if (!booking) {
      logger.warn(`No booking found for Razorpay order ${orderId}`);
      return;
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "PAID",
        paymentMethod: "RAZORPAY",
        paymentId: paymentId,
        paymentDate: new Date(),
      },
    });

    // Update ticket status to SOLD
    await prisma.ticket.updateMany({
      where: {
        bookings: {
          some: {
            id: booking.id,
          },
        },
      },
      data: {
        status: "SOLD",
      },
    });

    logger.info(`Booking ${booking.id} marked as paid via webhook`);
  } catch (error) {
    logger.error("Error handling payment.authorized webhook:", {
      error: (error as Error).message,
    });
  }
}

/**
 * Handle payment.failed event
 * @param payment Payment details from webhook
 */
async function handlePaymentFailed(payment: any): Promise<void> {
  try {
    const orderId = payment.order_id;

    // Find booking by order ID
    const booking = await prisma.booking.findFirst({
      where: { paymentId: orderId },
    });

    if (!booking) {
      logger.warn(`No booking found for Razorpay order ${orderId}`);
      return;
    }

    // Update booking status - use a valid status from the enum
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELED", // Using a valid status from BookingStatus enum
      },
    });

    logger.info(
      `Booking ${booking.id} marked as canceled due to payment failure via webhook`
    );
  } catch (error) {
    logger.error("Error handling payment.failed webhook:", {
      error: (error as Error).message,
    });
  }
}

/**
 * Handle order.paid event
 * @param order Order details from webhook
 */
async function handleOrderPaid(order: any): Promise<void> {
  try {
    const orderId = order.id;

    // Find booking by order ID
    const booking = await prisma.booking.findFirst({
      where: { paymentId: orderId },
    });

    if (!booking) {
      logger.warn(`No booking found for Razorpay order ${orderId}`);
      return;
    }

    // If booking is not already paid, update it
    if (booking.status !== "PAID") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "PAID",
          paymentMethod: "RAZORPAY",
          paymentDate: new Date(),
        },
      });

      // Update ticket status to SOLD
      await prisma.ticket.updateMany({
        where: {
          bookings: {
            some: {
              id: booking.id,
            },
          },
        },
        data: {
          status: "SOLD",
        },
      });

      logger.info(
        `Booking ${booking.id} marked as paid via order.paid webhook`
      );
    }
  } catch (error) {
    logger.error("Error handling order.paid webhook:", {
      error: (error as Error).message,
    });
  }
}

/**
 * Handle refund.created event
 * @param refund Refund details from webhook
 */
async function handleRefundCreated(refund: any): Promise<void> {
  try {
    const paymentId = refund.payment_id;

    // Find booking by payment ID
    const booking = await prisma.booking.findFirst({
      where: { paymentId },
    });

    if (!booking) {
      logger.warn(`No booking found for Razorpay payment ${paymentId}`);
      return;
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELED", // Using a valid status from BookingStatus enum
      },
    });

    logger.info(
      `Booking ${booking.id} marked as canceled due to refund via webhook`
    );
  } catch (error) {
    logger.error("Error handling refund.created webhook:", {
      error: (error as Error).message,
    });
  }
}

/**
 * Handle payment refund
 * @param paymentId Razorpay payment ID
 * @param options Refund options
 * @returns Refund details
 */
export async function refundPayment(
  paymentId: string,
  options: {
    amount?: number;
    notes?: Record<string, string>;
  } = {}
): Promise<any> {
  if (!initialized) {
    throw new AppError(
      "Payment gateway is not properly configured",
      StatusCodes.SERVICE_UNAVAILABLE
    );
  }

  const { amount, notes = {} } = options;
  const refundOptions: Record<string, any> = { notes };

  // Add amount if specified
  if (amount) {
    refundOptions.amount = Math.round(amount * 100); // Convert to paise
  }

  try {
    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    logger.info(`Refund initiated for payment ${paymentId}`, {
      refundId: refund.id,
      amount: refund.amount,
    });

    // Try to update booking status if this payment ID is associated with a booking
    try {
      const booking = await prisma.booking.findFirst({
        where: { paymentId },
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELED", // Using a valid status from BookingStatus enum
          },
        });
        logger.info(`Booking ${booking.id} marked as canceled due to refund`);
      }
    } catch (dbError) {
      logger.error(`Error updating booking status for refund:`, {
        error: (dbError as Error).message,
        paymentId,
      });
    }

    return refund;
  } catch (error) {
    logger.error(`Error refunding payment ${paymentId}`, {
      error: (error as Error).message,
      amount,
    });

    throw new AppError(
      `Failed to process refund: ${(error as Error).message}`,
      StatusCodes.SERVICE_UNAVAILABLE
    );
  }
}
