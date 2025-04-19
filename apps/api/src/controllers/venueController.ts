import { Request, Response } from "express";
import { AuthRequest } from "../types";
import * as venueService from "../services/venueService";

/**
 * Get all venues with pagination
 */
export const getAllVenues = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const isActive = req.query.includeInactive === "true" ? undefined : true;

    const result = await venueService.getAllVenues(page, limit, isActive);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get all venues error:", error);
    return res.status(500).json({ message: "Failed to get venues" });
  }
};

/**
 * Get venue by ID
 */
export const getVenueById = async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;

    const venue = await venueService.getVenueById(venueId as string);

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    return res.status(200).json(venue);
  } catch (error) {
    console.error("Get venue by ID error:", error);
    return res.status(500).json({ message: "Failed to get venue" });
  }
};

/**
 * Create a new venue (Admin only)
 */
export const createVenue = async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, city, country, capacity, description, imageUrl } =
      req.body;

    if (!name || !address || !city || !country || !capacity) {
      return res.status(400).json({
        message: "Required fields: name, address, city, country, capacity",
      });
    }

    const venue = await venueService.createVenue({
      name,
      address,
      city,
      country,
      capacity: Number(capacity),
      description,
      imageUrl,
    });

    return res.status(201).json(venue);
  } catch (error) {
    console.error("Create venue error:", error);
    return res.status(500).json({ message: "Failed to create venue" });
  }
};

/**
 * Update an existing venue (Admin only)
 */
export const updateVenue = async (req: AuthRequest, res: Response) => {
  try {
    const { venueId } = req.params;
    const {
      name,
      address,
      city,
      country,
      capacity,
      description,
      imageUrl,
      isActive,
    } = req.body;

    const existingVenue = await venueService.getVenueById(venueId as string);
    if (!existingVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const venue = await venueService.updateVenue(venueId as string, {
      name,
      address,
      city,
      country,
      capacity: capacity ? Number(capacity) : undefined,
      description,
      imageUrl,
      isActive,
    });

    return res.status(200).json(venue);
  } catch (error) {
    console.error("Update venue error:", error);
    return res.status(500).json({ message: "Failed to update venue" });
  }
};

/**
 * Delete a venue (Admin only, soft delete)
 */
export const deleteVenue = async (req: AuthRequest, res: Response) => {
  try {
    const { venueId } = req.params;

    const existingVenue = await venueService.getVenueById(venueId as string);
    if (!existingVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    await venueService.deleteVenue(venueId as string);

    return res.status(200).json({ message: "Venue deleted successfully" });
  } catch (error) {
    console.error("Delete venue error:", error);
    return res.status(500).json({ message: "Failed to delete venue" });
  }
};
