import { Request, Response } from "express";
import { AuthRequest } from "../types";
import * as showService from "../services/showService";
import { createServiceLogger } from "../utils/logger";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/database";

const logger = createServiceLogger("seat-section-controller");

/**
 * Create a new seat section
 */
export const createSeatSection = async (req: AuthRequest, res: Response) => {
  try {
    const { showtimeId, priceTierId, name, availableSeats } = req.body;

    // Validate required fields
    if (!showtimeId || !priceTierId || !name || !availableSeats) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          "Showtime ID, price tier ID, name, and available seats are required",
      });
    }

    // Validate numeric values
    if (isNaN(Number(availableSeats)) || Number(availableSeats) <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Available seats must be a positive number",
      });
    }

    const seatSection = await showService.createSeatSection({
      showtimeId,
      priceTierId,
      name,
      availableSeats: Number(availableSeats),
    });

    return res.status(StatusCodes.CREATED).json(seatSection);
  } catch (error: any) {
    logger.error("Error creating seat section", { error, body: req.body });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to create seat section", error: error.message });
  }
};

/**
 * Get seat sections by showtime ID
 */
export const getSeatSectionsByShowtimeId = async (
  req: Request,
  res: Response
) => {
  try {
    const { showtimeId } = req.params;

    const seatSections = await prisma.seatSection.findMany({
      where: {
        showtimeId,
        isActive: true,
      },
      include: {
        priceTier: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        priceTier: {
          price: "desc",
        },
      },
    });

    return res.status(StatusCodes.OK).json(seatSections);
  } catch (error: any) {
    logger.error("Error getting seat sections by showtime ID", {
      error,
      showtimeId: req.params.showtimeId,
    });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to get seat sections", error: error.message });
  }
};
