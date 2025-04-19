import { Request, Response } from "express";
import { AuthRequest } from "../types";
import * as showService from "../services/showService";
import * as venueService from "../services/venueService";
import * as categoryService from "../services/categoryService";
import { Prisma } from "@repo/database";
import { prisma } from "../lib/database";

/**
 * Get all shows with pagination
 */
export const getAllShows = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const isActive = req.query.includeInactive === "true" ? undefined : true;

    const result = await showService.getAllShows(page, limit, isActive);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get all shows error:", error);
    return res.status(500).json({ message: "Failed to get shows" });
  }
};

/**
 * Get show by ID with details
 */
export const getShowById = async (req: Request, res: Response) => {
  try {
    const { showId } = req.params;

    const show = await showService.getShowById(showId || "");

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    return res.status(200).json(show);
  } catch (error) {
    console.error("Get show by ID error:", error);
    return res.status(500).json({ message: "Failed to get show" });
  }
};

/**
 * Create a new show (Admin only)
 */
export const createShow = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      subtitle,
      description,
      imageUrl,
      thumbnailUrl,
      duration,
      ageLimit,
      language,
      venueId,
      categoryIds,
    } = req.body;

    if (!title || !duration || !venueId) {
      return res
        .status(400)
        .json({ message: "Title, duration, and venue ID are required" });
    }

    // Validate venue exists
    const venue = await venueService.getVenueById(venueId);
    if (!venue) {
      return res.status(400).json({ message: "Invalid venue ID" });
    }

    // Validate categories if provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      // Check if all categories exist
      for (const categoryId of categoryIds) {
        const category = await categoryService.getCategoryById(categoryId);
        if (!category) {
          return res.status(400).json({
            message: `Invalid category ID: ${categoryId}`,
          });
        }
      }
    }

    // Create the show
    const show = await showService.createShow({
      title,
      subtitle,
      description,
      imageUrl,
      thumbnailUrl,
      duration: Number(duration),
      ageLimit,
      language,
      venueId,
      categoryIds,
    });

    return res.status(201).json(show);
  } catch (error) {
    console.error("Create show error:", error);
    return res.status(500).json({ message: "Failed to create show" });
  }
};

/**
 * Update an existing show (Admin only)
 */
export const updateShow = async (req: AuthRequest, res: Response) => {
  try {
    const { showId } = req.params;
    const {
      title,
      subtitle,
      description,
      imageUrl,
      thumbnailUrl,
      duration,
      ageLimit,
      language,
      venueId,
      categoryIds,
      isActive,
    } = req.body;

    // Check if show exists
    const existingShow = await showService.getShowById(showId || "");
    if (!existingShow) {
      return res.status(404).json({ message: "Show not found" });
    }

    // Validate venue if provided
    if (venueId) {
      const venue = await venueService.getVenueById(venueId);
      if (!venue) {
        return res.status(400).json({ message: "Invalid venue ID" });
      }
    }

    // Validate categories if provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      // Check if all categories exist
      for (const categoryId of categoryIds) {
        const category = await categoryService.getCategoryById(categoryId);
        if (!category) {
          return res.status(400).json({
            message: `Invalid category ID: ${categoryId}`,
          });
        }
      }
    }

    // Update the show
    const updatedShow = await showService.updateShow(showId || "", {
      title,
      subtitle,
      description,
      imageUrl,
      thumbnailUrl,
      duration: duration ? Number(duration) : undefined,
      ageLimit,
      language,
      venueId,
      categoryIds,
      isActive,
    });

    return res.status(200).json(updatedShow);
  } catch (error) {
    console.error("Update show error:", error);
    return res.status(500).json({ message: "Failed to update show" });
  }
};

/**
 * Delete a show (Admin only, soft delete)
 */
export const deleteShow = async (req: AuthRequest, res: Response) => {
  try {
    const { showId } = req.params;

    // Check if show exists
    const existingShow = await showService.getShowById(showId || "");
    if (!existingShow) {
      return res.status(404).json({ message: "Show not found" });
    }

    await showService.deleteShow(showId || "");

    return res.status(200).json({ message: "Show deleted successfully" });
  } catch (error) {
    console.error("Delete show error:", error);
    return res.status(500).json({ message: "Failed to delete show" });
  }
};

/**
 * Create a new event for a show (Admin only)
 */
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { showId, date } = req.body;

    if (!showId || !date) {
      return res.status(400).json({ message: "Show ID and date are required" });
    }

    // Check if show exists
    const show = await showService.getShowById(showId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    const event = await showService.createEvent({
      showId,
      date: new Date(date),
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error("Create event error:", error);
    return res.status(500).json({ message: "Failed to create event" });
  }
};

/**
 * Create a new showtime for an event (Admin only)
 */
export const createShowtime = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, startTime, endTime } = req.body;

    if (!eventId || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Event ID, start time, and end time are required" });
    }

    const showtime = await showService.createShowtime({
      eventId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });

    return res.status(201).json(showtime);
  } catch (error) {
    console.error("Create showtime error:", error);
    return res.status(500).json({ message: "Failed to create showtime" });
  }
};

/**
 * Create a seat section for a showtime (Admin only)
 */
export const createSeatSection = async (req: AuthRequest, res: Response) => {
  try {
    const {
      showtimeId,
      categoryId,
      name,
      totalSeats,
      availableSeats,
      price,
      currency,
    } = req.body;

    if (
      !showtimeId ||
      !categoryId ||
      !name ||
      !totalSeats ||
      !availableSeats ||
      !price
    ) {
      return res.status(400).json({
        message:
          "Required fields: showtimeId, categoryId, name, totalSeats, availableSeats, price",
      });
    }

    console.log("Creating seat section with data:", {
      showtimeId,
      categoryId,
      name,
      totalSeats,
      availableSeats,
      price,
      currency,
    });

    // Validate category exists
    const category = await categoryService.getCategoryById(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    // Get show ID from showtime to create or find price tier
    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        event: {
          include: {
            show: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!showtime) {
      return res.status(400).json({ message: "Invalid showtime ID" });
    }

    const showId = showtime.event.show.id;

    // Find existing price tier or create a new one
    let priceTier = await prisma.priceTier.findFirst({
      where: {
        showId,
        categoryId,
      },
    });

    if (!priceTier) {
      // Create a new price tier
      priceTier = await prisma.priceTier.create({
        data: {
          showId,
          categoryId,
          capacity: Number(totalSeats),
          price: new Prisma.Decimal(price),
          currency: currency || "INR",
        },
      });
      console.log("Created new price tier:", priceTier.id);
    } else {
      // Update the existing price tier with new values
      priceTier = await prisma.priceTier.update({
        where: { id: priceTier.id },
        data: {
          capacity: Number(totalSeats),
          price: new Prisma.Decimal(price),
          currency: currency || "INR",
        },
      });
      console.log("Updated existing price tier:", priceTier.id);
    }

    // Create the seat section (without waiting for tickets)
    const seatSection = await prisma.seatSection.create({
      data: {
        name,
        availableSeats: Number(availableSeats),
        priceTierId: priceTier.id,
        showtimeId,
      },
      include: {
        priceTier: {
          include: {
            category: true,
          },
        },
      },
    });

    console.log("Seat section created:", seatSection.id);

    // Send immediate response
    res.status(201).json({
      success: true,
      message:
        "Seat section created successfully. Tickets being generated in background.",
      data: seatSection,
    });

    // Generate tickets in background (after response is sent)
    const generateTickets = async () => {
      try {
        console.log(
          "Starting background ticket generation for section:",
          seatSection.id
        );

        // Prepare ticket data for batch creation with minimal work
        const ticketData = Array(Number(availableSeats))
          .fill(null)
          .map((_, i) => ({
            sectionId: seatSection.id,
            status: "AVAILABLE" as const,
            code: `${seatSection.id.slice(-8)}-${i + 1}`,
            price: priceTier.price,
            currency: priceTier.currency || "INR",
          }));

        // Create tickets in batch
        await prisma.ticket.createMany({
          data: ticketData,
        });

        // Invalidate relevant caches
        const cachePromises = [
          `show:${showId}:details`,
          `showtime:${showtimeId}:*`,
        ].filter(Boolean);

        if (cachePromises.length > 0) {
          try {
            const { deleteCache, deleteCachePattern } = await import(
              "../utils/redis"
            );
            await Promise.all([
              deleteCache(`show:${showId}:details`),
              deleteCachePattern(`showtime:${showtimeId}:*`),
            ]);
          } catch (cacheError) {
            console.error("Cache invalidation error:", cacheError);
          }
        }

        console.log(
          "Background ticket generation completed successfully for section:",
          seatSection.id
        );
      } catch (error) {
        console.error("Error in background ticket generation:", error);
      }
    };

    // Execute ticket generation without awaiting
    generateTickets();
  } catch (error) {
    console.error("Create seat section error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create seat section",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
