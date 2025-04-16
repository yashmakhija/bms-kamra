import { Response } from "express";
import { prisma } from "@repo/database";
import { AuthRequest } from "../types";
import { comparePassword, hashPassword } from "../utils/auth";

/**
 * Get the current user's profile
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Failed to get user profile" });
  }
};

/**
 * Update the current user's profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { name, image } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name && !image) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
      });
    }

    const updateData: { name?: string; image?: string } = {};
    if (name) updateData.name = name;
    if (image) updateData.image = image;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update user profile" });
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has a password (might be registered via social login)
    if (!user.password) {
      return res.status(400).json({
        message:
          "Cannot change password for accounts created with social login",
      });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
};

/**
 * Delete user account
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { password } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.password) {
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Password is incorrect" });
      }
    }

    await prisma.$transaction([
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),

      prisma.account.deleteMany({
        where: { userId: user.id },
      }),

      prisma.otpCode.deleteMany({
        where: { userId: user.id },
      }),

      prisma.user.delete({
        where: { id: user.id },
      }),
    ]);

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ message: "Failed to delete account" });
  }
};
