import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  webhook,
  getStatus,
} from "../controllers/razorpayController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router: Router = Router();

// Public endpoint to check Razorpay configuration
router.get("/status", getStatus);

// Routes that require authentication
router.use("/orders", authMiddleware);
router.use("/verify", authMiddleware);

// Create Razorpay order for a booking
router.post("/orders/:bookingId", createOrder);

// Verify Razorpay payment
router.post("/verify/:bookingId", verifyPayment);

// Webhook doesn't require auth - it's called by Razorpay
router.post("/webhook", webhook);

export default router;
