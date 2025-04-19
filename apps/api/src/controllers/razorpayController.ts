import { Request, Response } from "express";
import { AuthRequest } from "../types";
import * as razorpayService from "../services/razorpayService";
import { AppError } from "../utils/errors";

/**
 * Create a Razorpay order for a booking
 */
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const result = await razorpayService.createOrder(bookingId as string);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create payment order";
    return res.status(400).json({ message: errorMessage });
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
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({
        message:
          "Required fields: razorpayPaymentId, razorpayOrderId, razorpaySignature",
      });
    }

    const result = await razorpayService.verifyPayment(bookingId as string, {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to verify payment";
    return res.status(400).json({ message: errorMessage });
  }
};

/**
 * Handle Razorpay webhook
 */
export const webhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      return res.status(400).json({ message: "Missing webhook signature" });
    }

    const result = await razorpayService.handleWebhook(req.body, signature);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process webhook";
    return res.status(400).json({ message: errorMessage });
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

    return res.status(200).json({
      status: isConfigured ? "configured" : "not_configured",
      keyId: process.env.RAZORPAY_KEY_ID
        ? `${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...`
        : null,
      webhookConfigured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Razorpay status check error:", error);
    return res.status(500).json({ message: "Failed to check Razorpay status" });
  }
};
