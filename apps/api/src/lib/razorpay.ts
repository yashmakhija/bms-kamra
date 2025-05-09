/**
 * RazorpayClient - A singleton client for interacting with Razorpay API
 * This file provides a class-based wrapper around the Razorpay SDK
 */

import Razorpay from "razorpay";
import { createHmac } from "crypto";
import { createServiceLogger } from "../utils/logger";
import { AppError } from "../utils/errors";
import { StatusCodes } from "http-status-codes";

const logger = createServiceLogger("razorpay-client");

interface RefundOptions {
  amount: number;
  notes?: Record<string, string | number>;
}

// Type definitions for Razorpay responses
interface RazorpayOrder {
  id: string;
  entity: string;
  amount: string | number;
  amount_paid: string | number;
  amount_due: string | number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: string | number;
  currency: string;
  status: string;
  method: string;
  description: string;
  order_id: string;
  refund_status: string;
  captured: boolean;
  email: string;
  contact: string;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayRefund {
  id: string;
  entity: string;
  amount?: string | number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  receipt?: string;
  acquirer_data?: Record<string, string>;
  created_at: number;
  batch_id?: string;
  status: string;
  speed_processed?: string;
  speed_requested?: string;
}

class RazorpayClient {
  private static instance: RazorpayClient;
  private client: Razorpay;
  private isConfigured: boolean;

  private constructor() {
    // Check if Razorpay credentials are configured
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    this.isConfigured = !!(keyId && keySecret);

    if (!this.isConfigured) {
      logger.warn("Razorpay credentials are not properly configured");
    }

    // Initialize Razorpay client
    this.client = new Razorpay({
      key_id: keyId || "",
      key_secret: keySecret || "",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RazorpayClient {
    if (!RazorpayClient.instance) {
      RazorpayClient.instance = new RazorpayClient();
    }
    return RazorpayClient.instance;
  }

  /**
   * Check if Razorpay is configured
   */
  public isRazorpayConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Create a new order
   */
  public async createOrder(options: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrder> {
    this.ensureConfigured();

    try {
      const order = await this.client.orders.create({
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        notes: options.notes || {},
      });

      logger.info(`Created Razorpay order: ${order.id}`, {
        receipt: options.receipt,
        amount: options.amount,
      });

      return order as RazorpayOrder;
    } catch (error) {
      logger.error("Failed to create Razorpay order:", { error });
      throw new AppError(
        `Payment gateway error: ${(error as Error).message}`,
        StatusCodes.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Verify payment signature
   */
  public verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    this.ensureConfigured();

    try {
      const webhookSecret = process.env.RAZORPAY_KEY_SECRET || "";
      const generatedSignature = createHmac("sha256", webhookSecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = generatedSignature === signature;

      if (!isValid) {
        logger.warn("Invalid Razorpay signature detected", {
          orderId,
          paymentId,
        });
      }

      return isValid;
    } catch (error) {
      logger.error("Error verifying Razorpay signature:", { error });
      return false;
    }
  }

  /**
   * Fetch payment details
   */
  public async getPaymentDetails(paymentId: string): Promise<RazorpayPayment> {
    this.ensureConfigured();

    try {
      return (await this.client.payments.fetch(paymentId)) as RazorpayPayment;
    } catch (error) {
      logger.error(`Failed to fetch payment details for ${paymentId}:`, {
        error,
      });
      throw new AppError(
        `Payment not found: ${(error as Error).message}`,
        StatusCodes.NOT_FOUND
      );
    }
  }

  /**
   * Initiate a refund
   */
  public async refundPayment(
    paymentId: string,
    options: RefundOptions
  ): Promise<RazorpayRefund> {
    this.ensureConfigured();

    try {
      const refund = await this.client.payments.refund(paymentId, {
        amount: options.amount,
        notes: options.notes || {},
      });

      logger.info(`Refund initiated for payment ${paymentId}`, {
        refundId: refund.id,
        amount: options.amount,
      });

      return refund as RazorpayRefund;
    } catch (error) {
      logger.error(`Failed to refund payment ${paymentId}:`, { error });
      throw new AppError(
        `Refund failed: ${(error as Error).message}`,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  /**
   * Fetch refund status
   */
  public async getRefundStatus(refundId: string): Promise<RazorpayRefund> {
    this.ensureConfigured();

    try {
      return (await this.client.refunds.fetch(refundId)) as RazorpayRefund;
    } catch (error) {
      logger.error(`Failed to fetch refund status for ${refundId}:`, { error });
      throw new AppError(
        `Refund not found: ${(error as Error).message}`,
        StatusCodes.NOT_FOUND
      );
    }
  }

  /**
   * Ensure the client is configured
   */
  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new AppError(
        "Payment gateway is not properly configured",
        StatusCodes.SERVICE_UNAVAILABLE
      );
    }
  }
}

export default RazorpayClient;
