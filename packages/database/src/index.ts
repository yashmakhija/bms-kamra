import { PrismaClient } from ".prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export all types from Prisma Client, except for the enums we're exporting as values
export * from ".prisma/client";

// Import and re-export enum values
import {
  BookingStatus as PrismaBookingStatus,
  PaymentMethod as PrismaPaymentMethod,
  TicketStatus as PrismaTicketStatus,
  CategoryType as PrismaCategoryType,
  AdminRole as PrismaAdminRole,
} from ".prisma/client";

// Export enums as concrete values
export const BookingStatus = PrismaBookingStatus;
export const PaymentMethod = PrismaPaymentMethod;
export const TicketStatus = PrismaTicketStatus;
export const CategoryType = PrismaCategoryType;
export const AdminRole = PrismaAdminRole;

// Export the rest as types
export type {
  User,
  Admin,
  Account,
  Session,
  OtpCode,
  Venue,
  Show,
  Category,
  Event,
  Showtime,
  SeatSection,
  Ticket,
  TicketLock,
  Booking,
} from ".prisma/client";
