import { Response } from "express";
import { prisma } from "@repo/database";
import { AuthRequest } from "../types";
import { createAdminUser } from "../services/userService";
import { AdminRole } from "../types";

/**
 * Get admin profile with role information
 */
export const getAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user || !user.admin) {
      return res
        .status(403)
        .json({ message: "Forbidden - Admin access required" });
    }

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.admin.role,
      createdAt: user.admin.createdAt,
      updatedAt: user.admin.updatedAt,
    });
  } catch (error) {
    console.error("Admin profile error:", error);
    return res.status(500).json({ message: "Failed to get admin profile" });
  }
};

/**
 * Get all users (paginated)
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        image: true,
        isAdmin: true,
        createdAt: true,
        admin: {
          select: {
            role: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalUsers = await prisma.user.count();
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({ message: "Failed to get users" });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        image: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        admin: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(500).json({ message: "Failed to get user" });
  }
};

/**
 * Create a new admin user
 */
export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        message: "User ID and role are required",
      });
    }

    const validRoles = ["SUPER_ADMIN", "EDITOR"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      include: { admin: true },
    });

    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userExists.admin) {
      return res.status(400).json({
        message: "User is already an admin",
        currentRole: userExists.admin.role,
      });
    }

    await createAdminUser(userId, role as AdminRole);

    return res.status(201).json({
      message: "Admin created successfully",
      userId,
      role,
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return res.status(500).json({ message: "Failed to create admin" });
  }
};
