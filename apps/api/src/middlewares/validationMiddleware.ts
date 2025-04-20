import { Request, Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { createServiceLogger } from "../utils/logger";
import { prisma } from "../lib/database";

const logger = createServiceLogger("validation-middleware");

/**
 * Validates request data against defined validation rules
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

/**
 * Validation rules for login
 */
export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Validation rules for phone login
 */
export const phoneValidation = [
  body("phone")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Valid phone number is required (E.164 format recommended)"),
];

/**
 * Validation rules for OTP verification
 */
export const otpValidation = [
  body("phone")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Valid phone number is required (E.164 format recommended)"),
  body("code")
    .isLength({ min: 6, max: 6 })
    .withMessage("Valid 6-digit OTP code is required"),
];

/**
 * Validation rules for profile update
 */
export const profileUpdateValidation = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("image").optional().isURL().withMessage("Image must be a valid URL"),
];

/**
 * Validation rules for password change
 */
export const passwordChangeValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
];

/**
 * Validation rules for account deletion
 */
export const accountDeletionValidation = [
  body("password")
    .optional()
    .notEmpty()
    .withMessage("Password cannot be empty"),
];

/**
 * Middleware to validate requests using express-validator rules
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.debug("Validation failed", { errors: errors.array() });
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};


export const validateEntityExists = (
  paramName: string,
  model: any,
  errorMessage?: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params[paramName];
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: `${paramName} is required`,
        });
      }

      const entity = await model.findUnique({
        where: { id },
      });

      if (!entity) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: "error",
          message: errorMessage || `${paramName} not found`,
        });
      }

      // Attach entity to request for later use
      req.entity = entity;
      next();
    } catch (error) {
      logger.error(`Error validating entity existence: ${paramName}`, {
        error: (error as Error).message,
      });
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Error validating request",
      });
    }
  };
};

/**
 * Factory for complex validation middleware combining multiple strategies
 * @param validators Array of validation chains
 * @param customValidators Array of custom validation functions
 */
export const combineValidators = (
  validators: ValidationChain[] = [],
  customValidators: ((
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<any>)[] = []
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Run express-validator validations
      if (validators.length > 0) {
        await Promise.all(validators.map((validator) => validator.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: "error",
            message: "Validation failed",
            errors: errors.array(),
          });
        }
      }

      // Run custom validators in sequence
      for (const validator of customValidators) {
        const result = await validator(req, res, () => {});

        // If response is already sent, stop processing
        if (res.headersSent) {
          return;
        }
      }

      next();
    } catch (error) {
      logger.error("Error in combined validation", {
        error: (error as Error).message,
      });

      if (!res.headersSent) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: "error",
          message: "Error validating request",
        });
      }
    }
  };
};

/**
 * Validate capacity constraints when creating seat sections
 */
export const validateSeatSectionCapacity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { showtimeId, priceTierId, availableSeats } = req.body;

    if (!showtimeId || !priceTierId || !availableSeats) {
      return next();
    }

    // Get the price tier to check capacity
    const priceTier = await prisma.priceTier.findUnique({
      where: { id: priceTierId },
      include: {
        show: {
          include: { venue: true },
        },
      },
    });

    if (!priceTier) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Price tier not found",
      });
    }

    // Get the showtime to check event
    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        event: true,
      },
    });

    if (!showtime) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Showtime not found",
      });
    }

    // Verify showtime is for the same show as the price tier
    if (showtime.event.showId !== priceTier.showId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Showtime and price tier must belong to the same show",
      });
    }

    // Check if requested capacity exceeds price tier capacity
    if (Number(availableSeats) > priceTier.capacity) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: `Available seats (${availableSeats}) exceeds price tier capacity (${priceTier.capacity})`,
      });
    }

    // Get existing seat sections for this showtime and price tier to check total allocation
    const existingSections = await prisma.seatSection.findMany({
      where: {
        showtimeId,
        priceTierId,
      },
    });

    const totalExistingSeats = existingSections.reduce(
      (total, section) => total + section.availableSeats,
      0
    );

    // Check if adding these seats would exceed price tier capacity
    if (totalExistingSeats + Number(availableSeats) > priceTier.capacity) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: `Adding ${availableSeats} seats would exceed remaining capacity. Available: ${priceTier.capacity - totalExistingSeats}`,
      });
    }

    // Check venue capacity as well
    const venueCapacity = priceTier.show.venue.capacity;

    // Get all price tiers for this show
    const allPriceTiers = await prisma.priceTier.findMany({
      where: { showId: priceTier.showId },
    });

    const totalTierCapacity = allPriceTiers.reduce(
      (total, tier) => total + tier.capacity,
      0
    );

    if (totalTierCapacity > venueCapacity) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: `Total price tier capacity (${totalTierCapacity}) exceeds venue capacity (${venueCapacity})`,
      });
    }

    next();
  } catch (error) {
    logger.error("Error validating seat section capacity", {
      error: (error as Error).message,
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Error validating seat section capacity",
    });
  }
};

/**
 * Validate no double bookings within a transaction
 */
export const validateNoDoubleBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sectionId, quantity } = req.body;

    if (!sectionId || !quantity) {
      return next();
    }

    // Get section to check available seats
    const section = await prisma.seatSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Seat section not found",
      });
    }

    // Check if enough seats are available
    if (section.availableSeats < quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: `Not enough seats available. Requested: ${quantity}, Available: ${section.availableSeats}`,
      });
    }

    // Get available tickets count to double-check
    const availableTicketsCount = await prisma.ticket.count({
      where: {
        sectionId,
        status: "AVAILABLE",
      },
    });

    if (availableTicketsCount < quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: `Not enough tickets available. Requested: ${quantity}, Available: ${availableTicketsCount}`,
      });
    }

    next();
  } catch (error) {
    logger.error("Error validating booking", {
      error: (error as Error).message,
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Error validating booking",
    });
  }
};

// Use this to extend the Express Request type
declare global {
  namespace Express {
    interface Request {
      entity?: any;
    }
  }
}
