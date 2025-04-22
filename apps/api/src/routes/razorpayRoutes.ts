import { Router, Request, Response } from "express";
import {
  authMiddleware,
  isAdminMiddleware,
} from "../middlewares/authMiddleware";
import {
  createOrder,
  verifyPayment,
  webhook,
  initiateRefund,
  getStatus,
} from "../controllers/razorpayController";
import { validateRequest } from "../middlewares/validationMiddleware";
import { body } from "express-validator";
import { createServiceLogger } from "../utils/logger";
import { AuthRequest } from "../types";

const router: Router = Router();
const logger = createServiceLogger("razorpay-routes");

// Validation middleware
const paymentValidation = [
  body("razorpayOrderId")
    .notEmpty()
    .withMessage("Razorpay Order ID is required"),
  body("razorpayPaymentId")
    .notEmpty()
    .withMessage("Razorpay Payment ID is required"),
  body("razorpaySignature")
    .notEmpty()
    .withMessage("Razorpay Signature is required"),
];

const refundValidation = [
  body("amount").optional().isNumeric().withMessage("Amount must be a number"),
  body("notes").optional().isObject().withMessage("Notes must be an object"),
];

// Public endpoint to check Razorpay configuration
router.get("/status", getStatus);

// Create Razorpay order for a booking
router.post(
  "/orders/:bookingId",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    logger.info(
      `Creating Razorpay order for booking: ${req.params.bookingId}, user: ${req.user?.id}`
    );
    createOrder(req, res);
  }
);

// Verify Razorpay payment
router.post(
  "/verify/:bookingId",
  authMiddleware,
  paymentValidation,
  validateRequest,
  (req: AuthRequest, res: Response) => {
    logger.info(
      `Verifying Razorpay payment for booking: ${req.params.bookingId}, user: ${req.user?.id}`
    );
    verifyPayment(req, res);
  }
);

// Webhook doesn't require auth - it's called by Razorpay
router.post("/webhook", (req: Request, res: Response) => {
  logger.info("Received Razorpay webhook");
  webhook(req, res);
});

// Refund a payment (admin only)
router.post(
  "/refund/:paymentId",
  authMiddleware,
  isAdminMiddleware,
  refundValidation,
  validateRequest,
  (req: AuthRequest, res: Response) => {
    logger.info(
      `Initiating refund for payment: ${req.params.paymentId}, by admin: ${req.user?.id}`
    );
    initiateRefund(req, res);
  }
);

export default router;
