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

// Export all types from Prisma Client
export * from ".prisma/client";

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
  AdminRole,
  CategoryType,
  TicketStatus,
  BookingStatus,
  PaymentMethod,
} from ".prisma/client";
