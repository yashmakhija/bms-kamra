import { prisma, User, Admin } from "@repo/database";
import { hashPassword, generateOtpCode } from "../utils/auth";
import { sendOtpSms } from "./twilioService";
import { AdminRole } from "../types";

export const createUser = async (
  name: string,
  email: string,
  password: string
) => {
  const hashedPassword = await hashPassword(password);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      emailVerified: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });
};

export const findUserByEmail = async (
  email: string
): Promise<(User & { admin: Admin | null }) | null> => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      admin: true,
    },
  });
};

export const findUserById = async (
  id?: string | null
): Promise<(User & { admin: Admin | null }) | null> => {
  if (!id) return null;

  return prisma.user.findUnique({
    where: { id },
    include: {
      admin: true,
    },
  });
};

// Get user's admin role if exists
export const getUserAdminRole = async (
  userId: string
): Promise<AdminRole | null> => {
  const admin = await prisma.admin.findUnique({
    where: { userId },
  });

  return (admin?.role as AdminRole) || null;
};

// Check if user has admin privileges
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  const admin = await prisma.admin.findUnique({
    where: { userId },
  });

  return !!admin;
};

// Check if user has specific admin role
export const hasAdminRole = async (
  userId: string,
  requiredRole: AdminRole
): Promise<boolean> => {
  const admin = await prisma.admin.findUnique({
    where: { userId },
  });

  return admin?.role === requiredRole;
};

// Create a new admin user
export const createAdminUser = async (
  userId: string,
  role: AdminRole
): Promise<void> => {
  await prisma.admin.create({
    data: {
      userId,
      role,
    },
  });

  // Update the isAdmin flag in the user model for quicker checks
  await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: true },
  });
};

export const findOrCreateGoogleUser = async (
  email: string,
  name: string | null,
  picture: string | null,
  googleId: string
): Promise<User & { admin: Admin | null }> => {
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      admin: true,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || "",
        image: picture,
        emailVerified: new Date(),
        accounts: {
          create: {
            provider: "google",
            providerAccountId: googleId,
            type: "oauth",
          },
        },
      },
      include: {
        admin: true,
      },
    });
  } else {
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "google",
      },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          provider: "google",
          providerAccountId: googleId,
          type: "oauth",
        },
      });
    }
  }

  return user;
};

export const findOrCreateUserByPhone = async (
  phone: string
): Promise<User & { admin: Admin | null }> => {
  let user = await prisma.user.findFirst({
    where: { phone },
    include: {
      admin: true,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        phoneVerified: false,
      },
      include: {
        admin: true,
      },
    });
  }

  return user;
};

export const createOtpCode = async (userId: string, phone: string) => {
  const code = generateOtpCode();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await prisma.otpCode.create({
    data: {
      code,
      phone,
      userId,
      expiresAt,
    },
  });

  const sent = await sendOtpSms(phone, code);

  return { sent, code };
};

export const verifyOtpCode = async (phone: string, code: string) => {
  const otpCode = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpCode) {
    return { verified: false, userId: null };
  }

  await prisma.user.update({
    where: { id: otpCode.userId },
    data: { phoneVerified: true },
  });

  return { verified: true, userId: otpCode.userId };
};
