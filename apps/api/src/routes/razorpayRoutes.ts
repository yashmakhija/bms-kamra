import { Router } from "express";
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

const router: Router = Router();

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
router.post("/orders/:bookingId", authMiddleware, createOrder);

// Verify Razorpay payment
router.post(
  "/verify/:bookingId",
  authMiddleware,
  paymentValidation,
  validateRequest,
  verifyPayment
);

// Webhook doesn't require auth - it's called by Razorpay
router.post("/webhook", webhook);

// Refund a payment (admin only)
router.post(
  "/refund/:paymentId",
  authMiddleware,
  isAdminMiddleware,
  refundValidation,
  validateRequest,
  initiateRefund
);

export default router;
