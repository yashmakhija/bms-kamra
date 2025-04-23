import { Request, Response } from "express";
import { AuthRequest } from "../types";
import * as bookingService from "../services/bookingService";
import { AppError } from "../utils/errors";
import { StatusCodes } from "http-status-codes";

/**
 * Create a new booking
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { showtimeId, sectionId, quantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!showtimeId || !sectionId || !quantity) {
      return res.status(400).json({
        message: "Required fields: showtimeId, sectionId, quantity",
      });
    }

    const result = await bookingService.createBooking({
      userId,
      showtimeId,
      sectionId,
      quantity: Number(quantity),
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Create booking error:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.data && { data: error.data }),
      });
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create booking";
    return res.status(400).json({ message: errorMessage });
  }
};

/**
 * Get bookings for current user
 */
export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const bookings = await bookingService.getUserBookings(userId);

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Get user bookings error:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to get bookings" });
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.params;
  const userId = req.user?.id;
  const isAdmin = req.isAdmin;

  // Start with detailed request logging
  console.log(`[DEBUG] getBookingById - Request received`, {
    bookingId,
    userId,
    isAdmin,
    tokenExists: !!req.headers.authorization,
    userAgent: req.headers["user-agent"],
    referer: req.headers.referer || "none",
    timestamp: new Date().toISOString(),
  });

  try {
    if (!userId) {
      console.log(
        `[DEBUG] getBookingById - Auth failure: No user ID in request`
      );
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Log the exact params being passed to the service
    console.log(`[DEBUG] getBookingById - Calling service`, {
      bookingId: bookingId,
      passingUserId: isAdmin ? "undefined (admin access)" : userId,
      callerIsAdmin: isAdmin,
    });

    const booking = await bookingService.getBookingById(
      bookingId as string,
      req.isAdmin ? undefined : userId
    );

    // Log successful retrieval
    console.log(`[DEBUG] getBookingById - Booking retrieved successfully`, {
      bookingId,
      bookingUserId: booking.userId,
      requestUserId: userId,
      matches: booking.userId === userId || isAdmin,
      status: booking.status,
    });

    if (!booking) {
      console.log(`[DEBUG] getBookingById - Booking not found`, { bookingId });
      return res.status(404).json({ message: "Booking not found" });
    }

    // Log successful response
    console.log(`[DEBUG] getBookingById - Success response sent`, {
      bookingId,
      userId,
    });
    return res.status(200).json(booking);
  } catch (error) {
    // Enhanced error logging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorCode = error instanceof AppError ? error.statusCode : 500;

    console.error(`[DEBUG] getBookingById - Error`, {
      bookingId,
      userId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : "No stack trace",
      statusCode: errorCode,
      type: error instanceof AppError ? "AppError" : "Unknown",
    });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to get booking" });
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const result = await bookingService.cancelBooking(
      bookingId as string,
      userId
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Cancel booking error:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to cancel booking";
    return res.status(400).json({ message: errorMessage });
  }
};

/**
 * Process payment for a booking
 */
export const processPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, paymentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!paymentMethod || !paymentId) {
      return res.status(400).json({
        message: "Required fields: paymentMethod, paymentId",
      });
    }

    const booking = await bookingService.getBookingById(
      bookingId as string,
      userId
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (paymentMethod === "RAZORPAY") {
      return res.status(400).json({
        message:
          "For Razorpay payments, use the /razorpay/verify/:bookingId endpoint",
        redirectTo: `/razorpay/verify/${bookingId}`,
      });
    }

    const result = await bookingService.processPayment(
      bookingId as string,
      paymentMethod,
      paymentId
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Process payment error:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process payment";
    return res.status(400).json({ message: errorMessage });
  }
};

/**
 * Get all bookings (Admin only)
 */
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;
    const userId = req.query.userId as string | undefined;
    const showId = req.query.showId as string | undefined;

    const result = await bookingService.getAllBookings({
      page,
      limit,
      status,
      userId,
      showId,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get all bookings error:", error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to get bookings" });
  }
};
