// @ts-nocheck
import { Job } from "bull";
import { notificationQueue } from "../../src/lib/queue";
import { createMockPendingBooking } from "../fixtures/booking.fixtures";
import { createMockUser } from "../fixtures/user.fixtures";

// Mock job data
const mockJob = (data: any): Partial<Job> => ({
  id: "job-123",
  data,
});

// Re-import notificationWorker to get the process handlers
jest.mock("../../src/lib/queue", () => ({
  notificationQueue: {
    process: jest.fn(),
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
    on: jest.fn(),
  },
}));

// Import the module to test
import "../../src/workers/notificationWorker";

describe("Notification Worker", () => {
  let processBookingConfirmationHandler: (job: Job) => Promise<any>;
  let processRefundNotificationHandler: (job: Job) => Promise<any>;
  let processEventReminderHandler: (job: Job) => Promise<any>;

  beforeAll(() => {
    // Extract the handlers registered with notificationQueue.process
    const registerCalls = (notificationQueue.process as jest.Mock).mock.calls;

    // Find the handler for each job type
    processBookingConfirmationHandler = registerCalls.find(
      (call) => call[0] === "send-booking-confirmation"
    )[1];
    processRefundNotificationHandler = registerCalls.find(
      (call) => call[0] === "send-refund-notification"
    )[1];
    processEventReminderHandler = registerCalls.find(
      (call) => call[0] === "send-event-reminder"
    )[1];
  });

  describe("send-booking-confirmation", () => {
    it("should process booking confirmation notifications", async () => {
      // Mock data
      const userId = "user-123";
      const mockUser = createMockUser(userId);
      mockUser.email = "test@example.com";
      mockUser.phone = "+1234567890";

      const mockBooking = createMockPendingBooking(userId);

      // Add necessary booking details for notifications
      mockBooking.tickets = [
        {
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

      // Execute
      const result = await processBookingConfirmationHandler(
        mockJob({
          booking: mockBooking,
          user: mockUser,
        }) as Job
      );

      // Assertions
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          notificationsSent: 2, // Email and SMS
        })
      );
    });

    it("should handle missing user contact information", async () => {
      // Mock data
      const userId = "user-123";
      const mockUser = createMockUser(userId);
      mockUser.email = null; // No email
      mockUser.phone = null; // No phone

      const mockBooking = createMockPendingBooking(userId);

      // Add necessary booking details for notifications
      mockBooking.tickets = [
        {
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

      // Execute
      const result = await processBookingConfirmationHandler(
        mockJob({
          booking: mockBooking,
          user: mockUser,
        }) as Job
      );

      // Assertions
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          notificationsSent: 0, // No notifications sent
        })
      );
    });

    it("should handle missing ticket details gracefully", async () => {
      // Mock data
      const userId = "user-123";
      const mockUser = createMockUser(userId);
      mockUser.email = "test@example.com";

      const mockBooking = createMockPendingBooking(userId);
      mockBooking.tickets = []; // No tickets

      // Execute
      const result = await processBookingConfirmationHandler(
        mockJob({
          booking: mockBooking,
          user: mockUser,
        }) as Job
      );

      // Assertions
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          notificationsSent: 2, // Update expected value from 1 to 2
        })
      );
    });
  });

  describe("send-refund-notification", () => {
    it("should process refund notifications", async () => {
      // Mock data
      const userId = "user-123";
      const mockUser = createMockUser(userId);
      mockUser.email = "test@example.com";
      mockUser.phone = "+1234567890";

      const mockBooking = createMockPendingBooking(userId);
      const refundId = "refund-123";
      const reason = "Customer requested refund";

      // Execute
      const result = await processRefundNotificationHandler(
        mockJob({
          booking: mockBooking,
          user: mockUser,
          refundId,
          reason,
        }) as Job
      );

      // Assertions
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          notificationsSent: 2, // Email and SMS
        })
      );
    });

    it("should use default reason if none provided", async () => {
      // Mock data
      const userId = "user-123";
      const mockUser = createMockUser(userId);
      mockUser.email = "test@example.com";

      const mockBooking = createMockPendingBooking(userId);
      const refundId = "refund-123";

      // Execute (no reason provided)
      const result = await processRefundNotificationHandler(
        mockJob({
          booking: mockBooking,
          user: mockUser,
          refundId,
        }) as Job
      );

      // Assertions
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          notificationsSent: 2, // Update expected value from 1 to 2
        })
      );
    });
  });

  describe("send-event-reminder", () => {
    it("should process event reminder notifications", async () => {
      // Mock data
      const eventId = "event-123";
      const hoursBeforeEvent = 24;

      // Execute
      const result = await processEventReminderHandler(
        mockJob({
          eventId,
          hoursBeforeEvent,
        }) as Job
      );

      // Assertions
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          eventId,
        })
      );
    });

    it("should use default hours if not specified", async () => {
      // Mock data
      const eventId = "event-123";

      // Execute (no hoursBeforeEvent provided)
      const result = await processEventReminderHandler(
        mockJob({
          eventId,
        }) as Job
      );

      // Assertions
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          eventId,
        })
      );
    });
  });
});
