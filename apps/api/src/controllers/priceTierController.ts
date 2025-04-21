import { Request, Response } from "express";
import { AuthRequest } from "../types";
import * as priceTierService from "../services/priceTierService";
import * as categoryService from "../services/categoryService";
import { createServiceLogger } from "../utils/logger";
import { StatusCodes } from "http-status-codes";
import { CategoryType } from "@repo/database";

const logger = createServiceLogger("price-tier-controller");

/**
 * Get all price tiers with pagination
 */
export const getAllPriceTiers = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const isActive = req.query.includeInactive === "true" ? undefined : true;
    const showId = req.query.showId as string | undefined;

    const result = await priceTierService.getAllPriceTiers(
      page,
      limit,
      isActive,
      showId
    );

    return res.status(StatusCodes.OK).json(result);
  } catch (error: any) {
    logger.error("Error getting all price tiers", { error });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to get price tiers", error: error.message });
  }
};

/**
 * Get price tier by ID
 */
export const getPriceTierById = async (req: Request, res: Response) => {
  try {
    const { priceTierId } = req.params;

    const priceTier = await priceTierService.getPriceTierById(
      priceTierId as string
    );

    if (!priceTier) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Price tier not found" });
    }

    return res.status(StatusCodes.OK).json(priceTier);
  } catch (error: any) {
    logger.error("Error getting price tier by ID", {
      error,
      priceTierId: req.params.priceTierId,
    });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to get price tier", error: error.message });
  }
};

/**
 * Get price tiers by show ID
 */
export const getPriceTiersByShowId = async (req: Request, res: Response) => {
  try {
    const { showId } = req.params;

    const priceTiers = await priceTierService.getPriceTiersByShowId(
      showId as string
    );

    return res.status(StatusCodes.OK).json(priceTiers);
  } catch (error: any) {
    logger.error("Error getting price tiers by show ID", {
      error,
      showId: req.params.showId,
    });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to get price tiers", error: error.message });
  }
};

/**
 * Create a new price tier (Admin only)
 */
export const createPriceTier = async (req: AuthRequest, res: Response) => {
  try {
    const { showId, categoryType, capacity, price, currency, description } =
      req.body;

    // Validate required fields
    if (!showId || !categoryType || !price) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Show ID, category type, and price are required",
      });
    }

    // Validate category type
    if (!["VIP", "PREMIUM", "REGULAR"].includes(categoryType)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Category type must be one of: VIP, PREMIUM, REGULAR",
      });
    }

    // Validate numeric fields
    if (
      (capacity !== undefined && isNaN(Number(capacity))) ||
      isNaN(Number(price))
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Capacity and price must be valid numbers",
      });
    }

    // Get or create default category by type
    const category = await categoryService.getDefaultCategoryByType(
      categoryType as CategoryType
    );

    // Now create price tier with the appropriate category
    const priceTier = await priceTierService.createPriceTier({
      showId,
      categoryId: category.id,
      capacity: capacity !== undefined ? Number(capacity) : undefined,
      price,
      currency,
      description,
    });

    return res.status(StatusCodes.CREATED).json(priceTier);
  } catch (error: any) {
    logger.error("Error creating price tier", { error, body: req.body });

    // Handle unique constraint error separately
    if (error.message.includes("already exists")) {
      return res.status(StatusCodes.CONFLICT).json({
        message: error.message,
      });
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to create price tier", error: error.message });
  }
};

/**
 * Update an existing price tier (Admin only)
 */
export const updatePriceTier = async (req: AuthRequest, res: Response) => {
  try {
    const { priceTierId } = req.params;
    const { capacity, price, currency, description, isActive } = req.body;

    // Check if price tier exists
    const existingPriceTier = await priceTierService.getPriceTierById(
      priceTierId as string
    );

    if (!existingPriceTier) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Price tier not found" });
    }

    // Validate numeric fields if provided
    if (capacity !== undefined && isNaN(Number(capacity))) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Capacity must be a valid number",
      });
    }

    if (price !== undefined && isNaN(Number(price))) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Price must be a valid number",
      });
    }

    const updatedPriceTier = await priceTierService.updatePriceTier(
      priceTierId as string,
      {
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        price,
        currency,
        description,
        isActive,
      }
    );

    return res.status(StatusCodes.OK).json(updatedPriceTier);
  } catch (error: any) {
    logger.error("Error updating price tier", {
      error,
      priceTierId: req.params.priceTierId,
      body: req.body,
    });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to update price tier", error: error.message });
  }
};

/**
 * Delete a price tier (Admin only, soft delete)
 */
export const deletePriceTier = async (req: AuthRequest, res: Response) => {
  try {
    const { priceTierId } = req.params;

    // Check if price tier exists
    const existingPriceTier = await priceTierService.getPriceTierById(
      priceTierId as string
    );

    if (!existingPriceTier) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Price tier not found" });
    }

    await priceTierService.deletePriceTier(priceTierId as string);

    return res
      .status(StatusCodes.OK)
      .json({ message: "Price tier deleted successfully" });
  } catch (error: any) {
    logger.error("Error deleting price tier", {
      error,
      priceTierId: req.params.priceTierId,
    });

    // If the error is due to referenced seat sections
    if (error.message.includes("Cannot delete")) {
      return res.status(StatusCodes.CONFLICT).json({
        message: error.message,
      });
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to delete price tier", error: error.message });
  }
};
