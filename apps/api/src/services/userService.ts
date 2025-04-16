import { prisma } from "@repo/database";
import { hashPassword, generateOtpCode } from "../utils/auth";
import { sendOtpSms } from "./twilioService";

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

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findUserById = async (id?: string | null) => {
  if (!id) return null;

  return prisma.user.findUnique({
    where: { id },
  });
};

export const findOrCreateGoogleUser = async (
  email: string,
  name: string | null,
  picture: string | null,
  googleId: string
) => {
  let user = await prisma.user.findUnique({
    where: { email },
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

export const findOrCreateUserByPhone = async (phone: string) => {
  let user = await prisma.user.findFirst({
    where: { phone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        phoneVerified: false,
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
