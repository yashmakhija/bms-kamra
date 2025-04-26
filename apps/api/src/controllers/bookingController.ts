import { Request, Response } from "express";
import { AuthRequest } from "../types";
import { bookingQueue, paymentQueue } from "../lib/queue";
import { getDbClient } from "../lib/database";
import { AppError } from "../utils/errors";
import { StatusCodes } from "http-status-codes";
import { createServiceLogger } from "../utils/logger";

const logger = createServiceLogger("booking-controller");

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

    // Add job to booking queue
    const job = await bookingQueue.add(
      "create-booking",
      {
        userId,
        showtimeId,
        sectionId,
        quantity: Number(quantity),
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    return res.status(202).json({
      message: "Booking request accepted",
      jobId: job.id,
      status: "processing",
    });
  } catch (error) {
    logger.error("Create booking error:", { error });
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

    const bookings = await getDbClient("read").booking.findMany({
      where: { userId },
      include: {
        tickets: {
          include: {
            section: {
              include: {
                showtime: {
                  include: {
                    event: {
                      include: {
                        show: {
                          select: {
                            id: true,
                            title: true,
                            imageUrl: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(bookings);
  } catch (error) {
    logger.error("Get user bookings error:", { error });
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

  try {
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const booking = await getDbClient("read").booking.findUnique({
      where: {
        id: bookingId as string,
        ...(isAdmin ? {} : { userId }), // Only admins can view any booking
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

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json(booking);
  } catch (error) {
    logger.error("Get booking by ID error:", { error, bookingId });
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

    // Add job to booking queue
    const job = await bookingQueue.add(
      "cancel-booking",
      {
        bookingId,
        userId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    return res.status(202).json({
      message: "Booking cancellation request accepted",
      jobId: job.id,
      status: "processing",
    });
  } catch (error) {
    logger.error("Cancel booking error:", { error });
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
    const { paymentMethod, paymentId, paymentData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!paymentMethod || !paymentId) {
      return res.status(400).json({
        message: "Required fields: paymentMethod, paymentId",
      });
    }

    // Validate booking exists and belongs to user
    const booking = await getDbClient("read").booking.findUnique({
      where: {
        id: bookingId as string,
        userId,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Add job to payment queue
    const job = await paymentQueue.add(
      "verify-payment",
      {
        bookingId,
        paymentMethod,
        paymentId,
        paymentData: paymentData || {},
        userId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        timeout: 60000, // 60 seconds timeout for payment processing
      }
    );

    return res.status(202).json({
      message: "Payment verification in progress",
      jobId: job.id,
      status: "processing",
    });
  } catch (error) {
    logger.error("Process payment error:", { error });
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

    const skip = (page - 1) * limit;

    // Construct filter
    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (showId) {
      filter.tickets = {
        some: {
          section: {
            showtime: {
              event: {
                show: {
                  id: showId,
                },
              },
            },
          },
        },
      };
    }

    // Get total count
    const totalCount = await getDbClient("read").booking.count({
      where: filter,
    });

    // Get paginated results
    const bookings = await getDbClient("read").booking.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        tickets: {
          include: {
            section: {
              include: {
                showtime: {
                  include: {
                    event: {
                      include: {
                        show: {
                          select: {
                            id: true,
                            title: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    return res.status(200).json({
      bookings,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logger.error("Get all bookings error:", { error });
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to get bookings" });
  }
};
