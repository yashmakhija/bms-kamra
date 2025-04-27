import { Job } from "bull";
import { AppError } from "../../src/utils/errors";
import { paymentQueue, notificationQueue } from "../../src/lib/queue";
import { mockPrisma } from "../utils/db-helper";
import { BookingStatus, PaymentMethod, TicketStatus } from "@repo/database";
import {
  createMockPendingBooking,
  createMockTicket,
} from "../fixtures/booking.fixtures";
import { createMockUser } from "../fixtures/user.fixtures";
import RazorpayClient from "../../src/lib/razorpay";

// Mock job data
const mockJob = (data: any): Partial<Job> => ({
  id: "job-123",
  data,
});

// Mock Razorpay client
jest.mock("../../src/lib/razorpay", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn().mockReturnValue({
      verifyPayment: jest.fn().mockResolvedValue(true),
      refundPayment: jest.fn().mockResolvedValue({ id: "razorpay-refund-123" }),
    }),
  },
}));

// Mock cache service
jest.mock("../../src/utils/advancedCache", () => ({
  invalidateCachePattern: jest.fn().mockResolvedValue(true),
}));

// Re-import paymentWorker to get the process handlers
jest.mock("../../src/lib/queue", () => ({
  paymentQueue: {
    process: jest.fn(),
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
    on: jest.fn(),
  },
  notificationQueue: {
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
  },
}));

// Import the module to test
import "../../src/workers/paymentWorker";

describe("Payment Worker", () => {
  let processVerifyPaymentHandler: (job: Job) => Promise<any>;
  let processRefundHandler: (job: Job) => Promise<any>;

  beforeAll(() => {
    // Extract the handlers registered with paymentQueue.process
    const registerCalls = (paymentQueue.process as jest.Mock).mock.calls;

    // Find the handler for each job type
    processVerifyPaymentHandler = registerCalls.find(
      (call) => call[0] === "verify-payment"
    )[1];
    processRefundHandler = registerCalls.find(
      (call) => call[0] === "process-refund"
    )[1];
  });

  describe("verify-payment", () => {
    it("should successfully verify a Razorpay payment", async () => {
      // Mock data
      const bookingId = "booking-123";
      const paymentId = "payment-123";
      const paymentMethod = PaymentMethod.RAZORPAY;
      const paymentData = {
        signature: "mock-signature",
        orderId: "order-123",
      };

      const mockUser = createMockUser("user-123");
      const mockTicket1 = createMockTicket("ticket-1");
      const mockTicket2 = createMockTicket("ticket-2");

      const mockBooking = createMockPendingBooking(mockUser.id, [
        mockTicket1.id,
        mockTicket2.id,
      ]);
      mockBooking.user = mockUser as any;

      // Add ticket details needed for confirmation
      mockBooking.tickets = [
        {
          ...mockTicket1,
          section: {
            showtime: {
              startTime: new Date(),
              event: {
                show: {
                  title: "Test Show",
                },
              },
            },
          },
        },
        {
          ...mockTicket2,
          section: {
            showtime: {
              startTime: new Date(),
              event: {
                show: {
                  title: "Test Show",
                },
              },
            },
          },
        },
      ] as any;

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.PAID,
        paymentMethod,
        paymentId,
        paymentDate: new Date(),
      });
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 2 });

      // Execute
      const result = await processVerifyPaymentHandler(
        mockJob({
          bookingId,
          paymentId,
          paymentMethod,
          paymentData,
        }) as Job
      );

      // Assertions
      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: bookingId },
        include: {
          tickets: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      expect(RazorpayClient.getInstance().verifyPayment).toHaveBeenCalledWith(
        paymentData.orderId,
        paymentId,
        paymentData.signature
      );

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: expect.objectContaining({
          status: BookingStatus.PAID,
          paymentMethod,
          paymentId,
          paymentDate: expect.any(Date),
        }),
        include: expect.any(Object),
      });

      expect(mockPrisma.ticket.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [mockTicket1.id, mockTicket2.id] },
        },
        data: {
          status: "RESERVED",
        },
      });

      expect(notificationQueue.add).toHaveBeenCalledWith(
        "send-booking-confirmation",
        expect.objectContaining({
          booking: expect.any(Object),
          user: mockUser,
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          bookingId,
          status: BookingStatus.PAID,
          paymentMethod,
        })
      );
    });

    it("should throw an error if booking is not found", async () => {
      // Mock data
      const bookingId = "non-existent-booking";
      const paymentId = "payment-123";
      const paymentMethod = PaymentMethod.CREDIT_CARD;

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      // Execute and assert
      await expect(
        processVerifyPaymentHandler(
          mockJob({
            bookingId,
            paymentId,
            paymentMethod,
          }) as Job
        )
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should throw an error if booking status is not PENDING", async () => {
      // Mock data
      const bookingId = "booking-123";
      const paymentId = "payment-123";
      const paymentMethod = PaymentMethod.CREDIT_CARD;

      const mockUser = createMockUser("user-123");
      const mockBooking = createMockPendingBooking(mockUser.id);
      mockBooking.status = BookingStatus.PAID; // Already paid
      mockBooking.user = mockUser as any;

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      // Execute and assert
      await expect(
        processVerifyPaymentHandler(
          mockJob({
            bookingId,
            paymentId,
            paymentMethod,
          }) as Job
        )
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should throw an error if Razorpay verification fails", async () => {
      // Mock data
      const bookingId = "booking-123";
      const paymentId = "payment-123";
      const paymentMethod = PaymentMethod.RAZORPAY;
      const paymentData = {
        signature: "invalid-signature",
        orderId: "order-123",
      };

      const mockUser = createMockUser("user-123");
      const mockBooking = createMockPendingBooking(mockUser.id);
      mockBooking.user = mockUser as any;

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      // Mock verification failure
      (
        RazorpayClient.getInstance().verifyPayment as jest.Mock
      ).mockResolvedValueOnce(false);

      // Execute and assert
      await expect(
        processVerifyPaymentHandler(
          mockJob({
            bookingId,
            paymentId,
            paymentMethod,
            paymentData,
          }) as Job
        )
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("process-refund", () => {
    it("should successfully process a Razorpay refund", async () => {
      // Mock data
      const bookingId = "booking-123";
      const reason = "Customer requested refund";
      const adminId = "admin-123";

      const mockUser = createMockUser("user-123");
      const mockTicket1 = createMockTicket("ticket-1");
      const mockTicket2 = createMockTicket("ticket-2");

      // Create a paid booking
      const mockBooking = createMockPendingBooking(mockUser.id, [
        mockTicket1.id,
        mockTicket2.id,
      ]);
      mockBooking.status = BookingStatus.PAID;
      mockBooking.paymentMethod = PaymentMethod.RAZORPAY;
      mockBooking.paymentId = "razorpay-payment-123";
      mockBooking.user = mockUser as any;

      // Setup ticket section data for cache invalidation
      const mockTickets = [
        { id: mockTicket1.id, sectionId: "section-1" },
        { id: mockTicket2.id, sectionId: "section-1" },
      ];

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.REFUNDED,
        refundId: "razorpay-refund-123",
        refundDate: new Date(),
        refundReason: reason,
        refundedBy: adminId,
      });
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets);
      mockPrisma.seatSection.update.mockResolvedValue({
        id: "section-1",
        availableSeats: 52,
      });

      // Execute
      const result = await processRefundHandler(
        mockJob({
          bookingId,
          reason,
          adminId,
        }) as Job
      );

      // Assertions
      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: bookingId },
        include: {
          tickets: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      expect(RazorpayClient.getInstance().refundPayment).toHaveBeenCalledWith(
        mockBooking.paymentId,
        expect.objectContaining({
          amount: expect.any(Number),
          notes: expect.objectContaining({
            reason,
            bookingId,
            adminId,
          }),
        })
      );

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: expect.objectContaining({
          status: BookingStatus.REFUNDED,
          refundId: expect.any(String),
          refundDate: expect.any(Date),
          refundReason: reason,
          refundedBy: adminId,
        }),
      });

      expect(mockPrisma.ticket.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [mockTicket1.id, mockTicket2.id] },
        },
        data: {
          status: "AVAILABLE",
        },
      });

      expect(mockPrisma.seatSection.update).toHaveBeenCalledWith({
        where: { id: "section-1" },
        data: {
          availableSeats: {
            increment: 2,
          },
        },
      });

      expect(notificationQueue.add).toHaveBeenCalledWith(
        "send-refund-notification",
        expect.objectContaining({
          booking: expect.any(Object),
          user: mockUser,
          refundId: expect.any(String),
          reason,
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          bookingId,
          refundId: expect.any(String),
          status: BookingStatus.REFUNDED,
        })
      );
    });

    it("should throw an error if booking is not found", async () => {
      // Mock data
      const bookingId = "non-existent-booking";
      const reason = "Customer requested refund";

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      // Execute and assert
      await expect(
        processRefundHandler(
          mockJob({
            bookingId,
            reason,
          }) as Job
        )
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should throw an error if booking status is not PAID", async () => {
      // Mock data
      const bookingId = "booking-123";
      const reason = "Customer requested refund";

      const mockUser = createMockUser("user-123");
      const mockBooking = createMockPendingBooking(mockUser.id);
      mockBooking.status = BookingStatus.PENDING; // Not paid yet
      mockBooking.user = mockUser as any;

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      // Execute and assert
      await expect(
        processRefundHandler(
          mockJob({
            bookingId,
            reason,
          }) as Job
        )
      ).rejects.toBeInstanceOf(AppError);
    });

    it("should handle non-Razorpay payment methods", async () => {
      // Mock data
      const bookingId = "booking-123";
      const reason = "Customer requested refund";

      const mockUser = createMockUser("user-123");
      const mockTicket = createMockTicket("ticket-1");

      // Create a paid booking with credit card
      const mockBooking = createMockPendingBooking(mockUser.id, [
        mockTicket.id,
      ]);
      mockBooking.status = BookingStatus.PAID;
      mockBooking.paymentMethod = PaymentMethod.CREDIT_CARD;
      mockBooking.paymentId = "payment-123";
      mockBooking.user = mockUser as any;

      // Setup ticket section data
      const mockTickets = [{ id: mockTicket.id, sectionId: "section-1" }];

      // Setup mocks
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.REFUNDED,
        refundId: expect.stringMatching(/^manual-refund-/),
        refundDate: expect.any(Date),
        refundReason: reason,
      });
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets);
      mockPrisma.seatSection.update.mockResolvedValue({
        id: "section-1",
        availableSeats: 51,
      });

      // Execute
      const result = await processRefundHandler(
        mockJob({
          bookingId,
          reason,
        }) as Job
      );

      // Assertions
      // Should not call razorpay
      expect(RazorpayClient.getInstance().refundPayment).not.toHaveBeenCalled();

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          bookingId,
          refundId: expect.stringMatching(/^manual-refund-/),
          status: BookingStatus.REFUNDED,
        })
      );
    });
  });
});
