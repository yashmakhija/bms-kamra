import { Request, Response } from "express";
import { AuthRequest } from "../types";
import * as razorpayService from "../services/razorpayService";
import { AppError } from "../utils/errors";
import { getBookingById, processPayment } from "../services/bookingService";
import { createServiceLogger } from "../utils/logger";
import { StatusCodes } from "http-status-codes";

const logger = createServiceLogger("razorpay-controller");

/**
 * Create a Razorpay order for a booking
 */
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const notes = req.body.notes || {};
    const userId = req.user?.id;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "User not authenticated",
      });
    }

    // Fetch booking details with validation
    const booking = await getBookingById(bookingId as string, userId);

    if (!booking) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Booking not found",
      });
    }

    if (booking.status !== "PENDING") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: `Cannot create payment for booking with status: ${booking.status}`,
      });
    }

    // Create Razorpay order
    const result = await razorpayService.createOrder(booking, { notes });

    return res.status(StatusCodes.OK).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error("Create Razorpay order error:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create payment order",
    });
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "User not authenticated",
      });
    }

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message:
          "Required fields: razorpayPaymentId, razorpayOrderId, razorpaySignature",
      });
    }

    // First verify the signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid payment signature",
      });
    }

    // Process payment in booking service
    const result = await processPayment(
      bookingId as string,
      "RAZORPAY",
      razorpayPaymentId
    );

    return res.status(StatusCodes.OK).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error("Verify Razorpay payment error:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to verify payment",
    });
  }
};

/**
 * Handle Razorpay webhook
 */
export const webhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Missing webhook signature",
      });
    }

    // For webhooks, we need the raw body as a string to verify the signature
    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    // First verify signature
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      logger.warn("Invalid webhook signature received", { signature });
      // Return 200 to prevent repeated attempts, but with error status
      return res.status(StatusCodes.OK).json({
        status: "error",
        message: "Invalid webhook signature",
      });
    }

    // Process the webhook event
    const result = await razorpayService.processWebhook(req.body);

    if (!result.success) {
      logger.warn("Webhook processing failed", { message: result.message });
      // Return 200 to acknowledge receipt even if processing fails
      // This prevents Razorpay from retrying the webhook repeatedly
      return res.status(StatusCodes.OK).json({
        status: "warning",
        message: result.message,
      });
    }

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    logger.error("Razorpay webhook error:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Always return 200 for webhooks to prevent retries
    return res.status(StatusCodes.OK).json({
      status: "error",
      message: "Webhook received but processing failed",
    });
  }
};

/**
 * Initiate refund for a payment (admin only)
 */
export const initiateRefund = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { amount, notes } = req.body;

    if (!req.isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: "error",
        message: "Admin access required",
      });
    }

    if (!paymentId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Payment ID is required",
      });
    }

    // Process refund
    const refund = await razorpayService.refundPayment(paymentId, {
      amount,
      notes,
    });

    return res.status(StatusCodes.OK).json({
      status: "success",
      data: refund,
    });
  } catch (error) {
    logger.error("Error initiating refund:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to initiate refund",
    });
  }
};

/**
 * Check Razorpay integration status
 */
export const getStatus = async (req: Request, res: Response) => {
  try {
    const isConfigured =
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET;

    return res.status(StatusCodes.OK).json({
      status: isConfigured ? "configured" : "not_configured",
      keyId: process.env.RAZORPAY_KEY_ID
        ? `${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...`
        : null,
      webhookConfigured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    logger.error("Razorpay status check error:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to check Razorpay status",
    });
  }
};
