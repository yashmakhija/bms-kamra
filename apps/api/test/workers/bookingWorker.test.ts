import { Job } from "bull";
import { AppError } from "../../src/utils/errors";
import { bookingQueue, ticketQueue } from "../../src/lib/queue";
import { mockPrisma } from "../utils/db-helper";
import { BookingStatus } from "@repo/database";
import { createMockPendingBooking } from "../fixtures/booking.fixtures";
import { createMockSeatSection } from "../fixtures/show.fixtures";

// Mock the job data
const mockJob = (data: any): Partial<Job> => ({
  id: "job-123",
  data,
});

// Re-import bookingWorker to get the process handlers
jest.mock("../../src/lib/queue", () => ({
  bookingQueue: {
    process: jest.fn(),
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
    on: jest.fn(),
  },
  ticketQueue: {
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
  },
  notificationQueue: {
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
  },
}));

// Import the module to test
import "../../src/workers/bookingWorker";

describe("Booking Worker", () => {
  let processCreateBookingHandler: (job: Job) => Promise<any>;
  let processCancelBookingHandler: (job: Job) => Promise<any>;
  let processCheckExpiredHandler: (job: Job) => Promise<any>;

  beforeAll(() => {
    // Extract the handlers registered with bookingQueue.process
    const registerCalls = (bookingQueue.process as jest.Mock).mock.calls;

    // Find the handler for each job type
    processCreateBookingHandler = registerCalls.find(
      (call) => call[0] === "create-booking"
    )[1];
    processCancelBookingHandler = registerCalls.find(
      (call) => call[0] === "cancel-booking"
    )[1];
    processCheckExpiredHandler = registerCalls.find(
      (call) => call[0] === "check-expired-bookings"
    )[1];
  });

  describe("create-booking", () => {
    it("should successfully create a new booking and queue ticket reservation", async () => {
      // Mock data
      const userId = "user-123";
      const showtimeId = "showtime-123";
      const sectionId = "section-123";
      const quantity = 2;

      // Create a mock section with the needed properties
      const mockSection = {
        ...createMockSeatSection(showtimeId, "pricetier-123"),
        // Add the additional properties needed for testing
        priceTier: { price: 25.0 as any, currency: "INR" },
        showtime: { id: showtimeId },
      };

      // Create a complete booking mock with all required fields
      const mockBooking = {
        id: "booking-123",
        userId: userId,
        status: BookingStatus.PENDING,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: "INR",
        totalAmount: 50.0 as any,
        paymentMethod: null,
        paymentId: null,
        paymentDate: null,
        refundId: null,
        refundDate: null,
        refundReason: null,
        refundedBy: null,
        metadata: {},
        sectionId: sectionId,
        showtimeId: showtimeId,
        quantity: quantity,
      };

      // Setup mocks
      mockPrisma.seatSection.findUnique.mockResolvedValue(mockSection);
      mockPrisma.booking.create.mockResolvedValue(mockBooking);

      // Execute
      const result = await processCreateBookingHandler(
        mockJob({
          userId,
          showtimeId,
          sectionId,
          quantity,
        }) as Job
      );

      // Assertions
      expect(mockPrisma.seatSection.findUnique).toHaveBeenCalledWith({
        where: { id: sectionId },
        include: {
          priceTier: true,
          showtime: true,
        },
      });

      expect(mockPrisma.booking.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          status: "PENDING",
        }),
      });

      expect(ticketQueue.add).toHaveBeenCalledWith(
        "reserve-tickets",
        expect.objectContaining({
          sectionId,
          quantity,
          userId,
          bookingId: mockBooking.id,
        }),
        expect.any(Object)
      );

      expect(result).toEqual(
        expect.objectContaining({
          bookingId: mockBooking.id,
        })
      );
    });

    it("should throw an error if section is not found", async () => {
      // Mock data
      const userId = "user-123";
      const showtimeId = "showtime-123";
      const sectionId = "non-existent-section";
      const quantity = 2;

      // Setup mocks
      mockPrisma.seatSection.findUnique.mockResolvedValue(null);

      // Execute and assert
      await expect(
        processCreateBookingHandler(
          mockJob({
            userId,
            showtimeId,
            sectionId,
            quantity,
          }) as Job
        )
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should throw an error if section does not belong to the specified showtime", async () => {
      // Mock data
      const userId = "user-123";
      const showtimeId = "showtime-123";
      const sectionId = "section-123";
      const quantity = 2;

      // Create a mock section with different showtime
      const mockSection = {
        ...createMockSeatSection("different-showtime-id", "pricetier-123"),
        // Add the additional properties needed for testing
        priceTier: { price: 25.0 as any, currency: "INR" },
        showtime: { id: "different-showtime-id" },
      };

      // Setup mocks
      mockPrisma.seatSection.findUnique.mockResolvedValue(mockSection);

      // Execute and assert
      await expect(
        processCreateBookingHandler(
          mockJob({
            userId,
            showtimeId,
            sectionId,
            quantity,
          }) as Job
        )
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("cancel-booking", () => {
    it("should successfully cancel a pending booking", async () => {
      // Mock data
      const userId = "user-123";
      const bookingId = "booking-123";
      const mockTicket1 = { id: "ticket-1" };
      const mockTicket2 = { id: "ticket-2" };

      const mockBooking = createMockPendingBooking(userId, [
        mockTicket1.id,
        mockTicket2.id,
      ]);

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELED,
      });

      // Execute
      const result = await processCancelBookingHandler(
        mockJob({
          bookingId,
          userId,
        }) as Job
      );

      // Assertions
      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: {
          id: bookingId,
          userId,
        },
        include: {
          tickets: true,
        },
      });

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: {
          status: "CANCELED",
        },
      });

      expect(ticketQueue.add).toHaveBeenCalledWith(
        "release-tickets",
        expect.objectContaining({
          ticketIds: [mockTicket1.id, mockTicket2.id],
          userId,
        }),
        expect.any(Object)
      );

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          bookingId,
          status: "CANCELED",
        })
      );
    });

    it("should throw an error if booking is not found", async () => {
      // Mock data
      const userId = "user-123";
      const bookingId = "non-existent-booking";

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      // Execute and assert
      await expect(
        processCancelBookingHandler(
          mockJob({
            bookingId,
            userId,
          }) as Job
        )
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should throw an error if trying to cancel a paid booking", async () => {
      // Mock data
      const userId = "user-123";
      const bookingId = "booking-123";

      const mockBooking = createMockPendingBooking(userId);
      mockBooking.status = BookingStatus.PAID;

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      // Execute and assert
      await expect(
        processCancelBookingHandler(
          mockJob({
            bookingId,
            userId,
          }) as Job
        )
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("check-expired-bookings", () => {
    it("should process expired bookings and release tickets", async () => {
      // Mock data
      const batchSize = 2;
      const mockBooking1 = createMockPendingBooking("user-1", [
        "ticket-1",
        "ticket-2",
      ]);
      const mockBooking2 = createMockPendingBooking("user-2", [
        "ticket-3",
        "ticket-4",
      ]);

      // Setup mocks
      mockPrisma.booking.findMany.mockResolvedValue([
        mockBooking1,
        mockBooking2,
      ]);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBooking1,
        status: BookingStatus.EXPIRED,
      });

      // Execute
      const result = await processCheckExpiredHandler(
        mockJob({
          batchSize,
        }) as Job
      );

      // Assertions
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: "PENDING",
            expiresAt: {
              lt: expect.any(Date),
            },
          },
          include: {
            tickets: true,
          },
          take: batchSize,
        })
      );

      expect(mockPrisma.booking.update).toHaveBeenCalledTimes(2);

      expect(ticketQueue.add).toHaveBeenCalledTimes(2);
      expect(ticketQueue.add).toHaveBeenCalledWith(
        "release-tickets",
        expect.objectContaining({
          ticketIds: ["ticket-1", "ticket-2"],
          userId: "user-1",
        }),
        expect.any(Object)
      );

      expect(result).toEqual(
        expect.objectContaining({
          processed: 2,
        })
      );
    });

    it("should handle zero expired bookings", async () => {
      // Mock data
      const batchSize = 10;

      // Setup mocks
      mockPrisma.booking.findMany.mockResolvedValue([]);

      // Execute
      const result = await processCheckExpiredHandler(
        mockJob({
          batchSize,
        }) as Job
      );

      // Assertions
      expect(result).toEqual(
        expect.objectContaining({
          processed: 0,
        })
      );

      expect(ticketQueue.add).not.toHaveBeenCalled();
    });
  });
});
