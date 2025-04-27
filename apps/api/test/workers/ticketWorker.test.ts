import { Job } from "bull";
import { ticketQueue } from "../../src/lib/queue";
import { mockPrisma } from "../utils/db-helper";
import { createMockTicket } from "../fixtures/booking.fixtures";
import { TicketStatus } from "@repo/database";
import { LockManager } from "../../src/utils/lockManager";
import * as cacheService from "../../src/utils/advancedCache";

// Mock the job data
const mockJob = (data: any): Partial<Job> => ({
  id: "job-123",
  data,
});

// Mock LockManager
jest.mock("../../src/utils/lockManager", () => ({
  LockManager: {
    acquireLock: jest.fn().mockResolvedValue("mock-lock-token"),
    releaseLock: jest.fn().mockResolvedValue(true),
  },
}));

// Mock cache service
jest.mock("../../src/utils/advancedCache", () => ({
  invalidateCachePattern: jest.fn().mockResolvedValue(true),
}));

// Re-import ticketWorker to get the process handlers
jest.mock("../../src/lib/queue", () => ({
  ticketQueue: {
    process: jest.fn(),
    add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
    on: jest.fn(),
  },
}));

// Import the module to test
import "../../src/workers/ticketWorker";

describe("Ticket Worker", () => {
  let processReserveHandler: (job: Job) => Promise<any>;
  let processReleaseHandler: (job: Job) => Promise<any>;

  beforeAll(() => {
    // Extract the handlers registered with ticketQueue.process
    const registerCalls = (ticketQueue.process as jest.Mock).mock.calls;

    // Find the handler for each job type
    processReserveHandler = registerCalls.find(
      (call) => call[0] === "reserve-tickets"
    )[1];
    processReleaseHandler = registerCalls.find(
      (call) => call[0] === "release-tickets"
    )[1];
  });

  describe("reserve-tickets", () => {
    it("should successfully reserve tickets", async () => {
      // Mock data
      const sectionId = "section-123";
      const quantity = 2;
      const userId = "user-123";
      const bookingId = "booking-123";

      const mockSection = {
        id: sectionId,
        availableSeats: 10,
        priceTierId: "pricetier-123",
      };

      const mockPriceTier = {
        price: 25.0 as any,
        currency: "USD",
      };

      const mockTickets = [
        createMockTicket("ticket-1"),
        createMockTicket("ticket-2"),
      ];

      // Setup mocks
      mockPrisma.seatSection.findUnique.mockResolvedValue(mockSection as any);
      mockPrisma.priceTier.findUnique.mockResolvedValue(mockPriceTier as any);
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets);
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.ticketLock.create.mockResolvedValue({ id: "lock-1" } as any);
      mockPrisma.seatSection.update.mockResolvedValue({
        ...mockSection,
        availableSeats: 8,
      } as any);
      mockPrisma.booking.update.mockResolvedValue({ id: bookingId } as any);
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        // Execute each operation in the transaction
        for (const op of operations as any) {
          await op;
        }
        return [{ id: "lock-1" }, { id: "lock-2" }];
      });

      // Execute
      const result = await processReserveHandler(
        mockJob({
          sectionId,
          quantity,
          userId,
          bookingId,
        }) as Job
      );

      // Assertions
      expect(LockManager.acquireLock).toHaveBeenCalledWith(
        `section:${sectionId}:reserve`,
        expect.any(Number)
      );

      expect(mockPrisma.seatSection.findUnique).toHaveBeenCalledWith({
        where: { id: sectionId },
        select: { id: true, availableSeats: true, priceTierId: true },
      });

      expect(mockPrisma.priceTier.findUnique).toHaveBeenCalledWith({
        where: { id: mockSection.priceTierId },
        select: { price: true, currency: true },
      });

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith({
        where: {
          sectionId,
          status: "AVAILABLE",
        },
        take: quantity,
      });

      expect(mockPrisma.ticket.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["ticket-1", "ticket-2"] },
        },
        data: {
          status: "LOCKED",
        },
      });

      expect(mockPrisma.seatSection.update).toHaveBeenCalledWith({
        where: { id: sectionId },
        data: {
          availableSeats: {
            decrement: quantity,
          },
        },
      });

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: {
          tickets: {
            connect: [{ id: "ticket-1" }, { id: "ticket-2" }],
          },
        },
      });

      expect(cacheService.invalidateCachePattern).toHaveBeenCalledWith(
        `section:${sectionId}`
      );
      expect(LockManager.releaseLock).toHaveBeenCalled();

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          ticketIds: ["ticket-1", "ticket-2"],
          expiresAt: expect.any(Date),
        })
      );
    });

    it("should throw an error if lock cannot be acquired", async () => {
      // Mock data
      const sectionId = "section-123";
      const quantity = 2;
      const userId = "user-123";

      // Setup mocks
      (LockManager.acquireLock as jest.Mock).mockResolvedValueOnce(null);

      // Execute and assert
      await expect(
        processReserveHandler(
          mockJob({
            sectionId,
            quantity,
            userId,
          }) as Job
        )
      ).rejects.toThrow(`Could not acquire lock for section ${sectionId}`);
    });

    it("should throw an error if section has insufficient seats", async () => {
      // Mock data
      const sectionId = "section-123";
      const quantity = 5;
      const userId = "user-123";

      const mockSection = {
        id: sectionId,
        availableSeats: 3, // Not enough seats
        priceTierId: "pricetier-123",
      };

      // Setup mocks
      mockPrisma.seatSection.findUnique.mockResolvedValue(mockSection as any);

      // Execute and assert
      await expect(
        processReserveHandler(
          mockJob({
            sectionId,
            quantity,
            userId,
          }) as Job
        )
      ).rejects.toThrow(`Not enough available seats in section ${sectionId}`);

      expect(LockManager.releaseLock).toHaveBeenCalled();
    });
  });

  describe("release-tickets", () => {
    it("should successfully release tickets", async () => {
      // Mock data
      const userId = "user-123";
      const ticketIds = ["ticket-1", "ticket-2"];

      const mockTickets = [
        { id: "ticket-1", sectionId: "section-1" },
        { id: "ticket-2", sectionId: "section-1" },
      ];

      // Setup mocks
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets as any);
      mockPrisma.ticketLock.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.seatSection.update.mockResolvedValue({
        id: "section-1",
        availableSeats: 52,
      } as any);

      // Execute
      const result = await processReleaseHandler(
        mockJob({
          ticketIds,
          userId,
        }) as Job
      );

      // Assertions
      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ticketIds },
        },
        select: { id: true, sectionId: true },
      });

      expect(LockManager.acquireLock).toHaveBeenCalledWith(
        `section:section-1:release`,
        expect.any(Number)
      );

      expect(mockPrisma.ticketLock.deleteMany).toHaveBeenCalledWith({
        where: {
          ticketId: { in: ticketIds },
          userId,
        },
      });

      expect(mockPrisma.ticket.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ticketIds },
          status: "LOCKED",
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

      expect(cacheService.invalidateCachePattern).toHaveBeenCalledWith(
        `section:section-1`
      );
      expect(LockManager.releaseLock).toHaveBeenCalled();

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          releasedCount: 2,
        })
      );
    });

    it("should handle tickets from multiple sections", async () => {
      // Mock data
      const userId = "user-123";
      const ticketIds = ["ticket-1", "ticket-2", "ticket-3"];

      const mockTickets = [
        { id: "ticket-1", sectionId: "section-1" },
        { id: "ticket-2", sectionId: "section-1" },
        { id: "ticket-3", sectionId: "section-2" },
      ];

      // Setup mocks
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets as any);
      mockPrisma.ticketLock.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.seatSection.update
        .mockResolvedValueOnce({ id: "section-1", availableSeats: 52 } as any)
        .mockResolvedValueOnce({ id: "section-2", availableSeats: 31 } as any);

      // Execute
      const result = await processReleaseHandler(
        mockJob({
          ticketIds,
          userId,
        }) as Job
      );

      // Assertions
      expect(LockManager.acquireLock).toHaveBeenCalledTimes(2);
      expect(mockPrisma.seatSection.update).toHaveBeenCalledTimes(2);
      expect(cacheService.invalidateCachePattern).toHaveBeenCalledTimes(2);

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          releasedCount: 3,
        })
      );
    });

    it("should throw an error if lock cannot be acquired for any section", async () => {
      // Mock data
      const userId = "user-123";
      const ticketIds = ["ticket-1", "ticket-2"];

      const mockTickets = [
        { id: "ticket-1", sectionId: "section-1" },
        { id: "ticket-2", sectionId: "section-2" },
      ];

      // Setup mocks
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets as any);
      (LockManager.acquireLock as jest.Mock)
        .mockResolvedValueOnce("lock-token-1")
        .mockResolvedValueOnce(null);

      // Execute and assert
      await expect(
        processReleaseHandler(
          mockJob({
            ticketIds,
            userId,
          }) as Job
        )
      ).rejects.toThrow(`Could not acquire locks for all sections`);
    });
  });

  describe("race-conditions", () => {
    it("should handle concurrent ticket reservations with limited inventory", async () => {
      // Mock data - only 2 tickets available
      const sectionId = "section-123";
      const mockSection = {
        id: sectionId,
        availableSeats: 2, // Only 2 seats available
        priceTierId: "pricetier-123",
      };

      const mockPriceTier = {
        price: 25.0 as any,
        currency: "USD",
      };

      const mockTickets = [
        createMockTicket("ticket-1"),
        createMockTicket("ticket-2"),
      ];

      // Two users trying to book at the same time
      const user1 = { userId: "user-1", bookingId: "booking-1", quantity: 2 };
      const user2 = { userId: "user-2", bookingId: "booking-2", quantity: 2 };

      // Lock acquisition simulations
      let lockAcquisitionOrder: string[] = [];
      let lockReleaseOrder: string[] = [];
      let currentAvailableSeats = mockSection.availableSeats;
      let ticketsReserved: Record<string, string[]> = {}; // userId -> ticketIds

      // Track transactions and ticket status
      let ticketStatus: Record<string, string> = {
        "ticket-1": "AVAILABLE",
        "ticket-2": "AVAILABLE",
      };

      // Setup section and price tier mocks
      mockPrisma.seatSection.findUnique.mockImplementation(async () => {
        // Simulate some processing time to make race condition more likely
        await new Promise((resolve) => setTimeout(resolve, 5));
        return {
          ...mockSection,
          availableSeats: currentAvailableSeats,
        } as any;
      });

      mockPrisma.priceTier.findUnique.mockResolvedValue(mockPriceTier as any);

      // Setup ticket query mock
      mockPrisma.ticket.findMany.mockImplementation(async () => {
        // Return only available tickets
        return mockTickets.filter(
          (t) => ticketStatus[t.id] === "AVAILABLE"
        ) as any;
      });

      // Setup ticket update mock
      mockPrisma.ticket.updateMany.mockImplementation(async (args: any) => {
        const ticketIds = args.where.id.in;
        // Check if any tickets are already locked
        const alreadyLocked = ticketIds.some(
          (id) => ticketStatus[id] !== "AVAILABLE"
        );

        if (alreadyLocked) {
          return { count: 0 }; // No tickets updated
        }

        // Mark tickets as locked
        ticketIds.forEach((id) => {
          ticketStatus[id] = "LOCKED";
        });

        return { count: ticketIds.length };
      });

      // Mock section update (decrement seats)
      mockPrisma.seatSection.update.mockImplementation(async (args: any) => {
        const decrementBy = args.data.availableSeats.decrement;
        currentAvailableSeats -= decrementBy;
        return {
          ...mockSection,
          availableSeats: currentAvailableSeats,
        } as any;
      });

      // Mock booking update
      mockPrisma.booking.update.mockImplementation(async (args: any) => {
        const bookingId = args.where.id;
        const userId = bookingId === "booking-1" ? "user-1" : "user-2";
        const ticketIds = args.data.tickets.connect.map((c) => c.id);

        ticketsReserved[userId] = ticketIds;

        return { id: bookingId, tickets: ticketIds } as any;
      });

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        // Execute each operation in the transaction
        const results = [];
        for (const op of operations as any) {
          results.push(await op);
        }
        return results;
      });

      // Custom lock implementation to simulate race conditions
      (LockManager.acquireLock as jest.Mock).mockImplementation(
        async (lockKey: string) => {
          // Extract userId based on job data, not lockKey
          const userId = lockKey.includes("section-123")
            ? lockAcquisitionOrder.length === 0
              ? "user-1"
              : "user-2"
            : "unknown";

          lockAcquisitionOrder.push(userId);

          // Successfully acquire lock
          return `lock-token-${userId}`;
        }
      );

      (LockManager.releaseLock as jest.Mock).mockImplementation(
        async (lockKey: string, token: string) => {
          const userId = token.includes("user-1") ? "user-1" : "user-2";
          lockReleaseOrder.push(userId);
          return true;
        }
      );

      // Run both reservation requests "simultaneously"
      const [user1Result, user2Result] = await Promise.allSettled([
        processReserveHandler(
          mockJob({
            sectionId,
            quantity: user1.quantity,
            userId: user1.userId,
            bookingId: user1.bookingId,
          }) as Job
        ),

        processReserveHandler(
          mockJob({
            sectionId,
            quantity: user2.quantity,
            userId: user2.userId,
            bookingId: user2.bookingId,
          }) as Job
        ),
      ]);

      // Assertions
      // Check that only one user got the tickets
      const successfulUser =
        user1Result.status === "fulfilled" ? "user-1" : "user-2";
      const failedUser = successfulUser === "user-1" ? "user-2" : "user-1";

      // Verify that one succeeded and one failed
      expect(
        user1Result.status === "fulfilled" || user2Result.status === "fulfilled"
      ).toBeTruthy();
      expect(
        user1Result.status === "rejected" || user2Result.status === "rejected"
      ).toBeTruthy();

      // The successful user should be in the lock acquisition order (more flexible assertion)
      expect(lockAcquisitionOrder).toContain(successfulUser);

      // The successful user should have the tickets
      if (successfulUser === "user-1") {
        expect(user1Result.status).toBe("fulfilled");
        expect((user1Result as PromiseFulfilledResult<any>).value.success).toBe(
          true
        );
        expect(
          (user1Result as PromiseFulfilledResult<any>).value.ticketIds
        ).toHaveLength(2);
      } else {
        expect(user2Result.status).toBe("fulfilled");
        expect((user2Result as PromiseFulfilledResult<any>).value.success).toBe(
          true
        );
        expect(
          (user2Result as PromiseFulfilledResult<any>).value.ticketIds
        ).toHaveLength(2);
      }

      // Failed request should get an error about insufficient tickets
      if (failedUser === "user-1") {
        expect(user1Result.status).toBe("rejected");
        expect((user1Result as PromiseRejectedResult).reason.message).toContain(
          "Not enough available seats"
        );
      } else {
        expect(user2Result.status).toBe("rejected");
        expect((user2Result as PromiseRejectedResult).reason.message).toContain(
          "Not enough available seats"
        );
      }

      // Final checks
      expect(currentAvailableSeats).toBe(0); // All seats should be taken
      expect(Object.keys(ticketsReserved).length).toBe(1); // Only one user should have tickets
      expect(ticketsReserved[successfulUser]).toHaveLength(2); // Successful user should have 2 tickets

      // Both tickets should be locked now
      expect(ticketStatus["ticket-1"]).toBe("LOCKED");
      expect(ticketStatus["ticket-2"]).toBe("LOCKED");

      // Lock should be released for both users
      expect(lockReleaseOrder).toContain("user-1");
      expect(lockReleaseOrder).toContain("user-2");
    });

    it("should prevent the same ticket from being sold twice during concurrent bookings", async () => {
      // Mock data - two tickets with specific IDs
      const sectionId = "section-unique";
      const ticket1Id = "unique-ticket-1";
      const ticket2Id = "unique-ticket-2";

      const mockSection = {
        id: sectionId,
        availableSeats: 2,
        priceTierId: "pricetier-123",
      };

      const mockPriceTier = {
        price: 25.0 as any,
        currency: "USD",
      };

      // Setup section and pricing mocks
      mockPrisma.seatSection.findUnique.mockResolvedValue(mockSection as any);
      mockPrisma.priceTier.findUnique.mockResolvedValue(mockPriceTier as any);

      // Used to track which tickets have been sold
      let soldTickets: string[] = [];

      // The first call gets both tickets, subsequent calls get empty array
      mockPrisma.ticket.findMany
        .mockImplementationOnce(async () => {
          return [createMockTicket(ticket1Id), createMockTicket(ticket2Id)];
        })
        .mockImplementation(async () => {
          // After first call, no tickets available
          return [];
        });

      // Simulate ticket locking with validation
      mockPrisma.ticket.updateMany.mockImplementation(async (args: any) => {
        const ticketIdsToLock = args.where.id.in;

        // Check if any tickets are already sold
        const alreadySold = ticketIdsToLock.some((id) =>
          soldTickets.includes(id)
        );

        if (alreadySold) {
          throw new Error("Attempt to lock already sold tickets");
        }

        // Mark these tickets as sold
        soldTickets.push(...ticketIdsToLock);

        return { count: ticketIdsToLock.length };
      });

      // Mock other necessary DB operations
      mockPrisma.seatSection.update.mockResolvedValue(mockSection as any);
      mockPrisma.booking.update.mockResolvedValue({
        id: "test-booking",
      } as any);
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        const results = [];
        for (const op of operations as any) {
          results.push(await op);
        }
        return results;
      });

      // Run two reservation processes simultaneously for the same tickets
      const user1 = {
        userId: "user-unique-1",
        bookingId: "booking-unique-1",
        quantity: 2,
      };
      const user2 = {
        userId: "user-unique-2",
        bookingId: "booking-unique-2",
        quantity: 2,
      };

      const results = await Promise.allSettled([
        processReserveHandler(
          mockJob({
            sectionId,
            quantity: user1.quantity,
            userId: user1.userId,
            bookingId: user1.bookingId,
          }) as Job
        ),

        // Small delay to ensure the second request arrives during processing
        (async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return processReserveHandler(
            mockJob({
              sectionId,
              quantity: user2.quantity,
              userId: user2.userId,
              bookingId: user2.bookingId,
            }) as Job
          );
        })(),
      ]);

      // First user should get the tickets
      expect(results[0].status).toBe("fulfilled");
      if (results[0].status === "fulfilled") {
        expect(results[0].value.ticketIds).toContain(ticket1Id);
        expect(results[0].value.ticketIds).toContain(ticket2Id);
      }

      // Second user should get an error about not enough tickets
      expect(results[1].status).toBe("rejected");
      if (results[1].status === "rejected") {
        expect(results[1].reason.message).toContain(
          "Not enough tickets available"
        );
      }

      // Verify that sold tickets contains exactly the two tickets
      expect(soldTickets).toHaveLength(2);
      expect(soldTickets).toContain(ticket1Id);
      expect(soldTickets).toContain(ticket2Id);

      // Verify the second find query was called (attempting to find available tickets)
      expect(mockPrisma.ticket.findMany).toHaveBeenCalledTimes(2);
    });

    // New test for high concurrency with multiple users trying to book limited tickets
    it("should maintain data consistency under high concurrency", async () => {
      // Mock a section with limited tickets (5 available)
      const sectionId = "section-high-concurrency";
      const mockSection = {
        id: sectionId,
        availableSeats: 5,
        priceTierId: "pricetier-123",
      };

      const mockPriceTier = {
        price: 25.0 as any,
        currency: "USD",
      };

      // Create 5 tickets
      const mockTickets = Array.from({ length: 5 }, (_, i) =>
        createMockTicket(`ticket-hc-${i + 1}`)
      );

      // Create 10 users all trying to book 1 ticket each
      const users = Array.from({ length: 10 }, (_, i) => ({
        userId: `user-hc-${i + 1}`,
        bookingId: `booking-hc-${i + 1}`,
        quantity: 1,
      }));

      // Tracking variables
      let lockCounter = 0;
      let currentAvailableSeats = mockSection.availableSeats;
      let ticketStatus: Record<string, string> = {};
      let ticketsReserved: Record<string, string[]> = {};
      let usersWithLocks: string[] = [];
      let locksReleased = 0;

      // Initialize all tickets as available
      mockTickets.forEach((ticket) => {
        ticketStatus[ticket.id] = "AVAILABLE";
      });

      // Setup mocks
      mockPrisma.seatSection.findUnique.mockImplementation(async () => {
        // Add small random delay to simulate real-world conditions
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 5)));
        return {
          ...mockSection,
          availableSeats: currentAvailableSeats,
        } as any;
      });

      mockPrisma.priceTier.findUnique.mockResolvedValue(mockPriceTier as any);

      mockPrisma.ticket.findMany.mockImplementation(async (args: any) => {
        // Add small random delay to simulate real-world conditions
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 3)));

        // Filter to only available tickets and limit by quantity
        const availableTickets = mockTickets
          .filter((t) => ticketStatus[t.id] === "AVAILABLE")
          .slice(0, args.take || 1);

        return availableTickets as any;
      });

      mockPrisma.ticket.updateMany.mockImplementation(async (args: any) => {
        const ticketIds = args.where.id.in;

        // Check if any tickets are already locked
        const alreadyLocked = ticketIds.some(
          (id) => ticketStatus[id] !== "AVAILABLE"
        );

        if (alreadyLocked) {
          return { count: 0 }; // No tickets updated
        }

        // Mark tickets as locked
        ticketIds.forEach((id) => {
          ticketStatus[id] = "LOCKED";
        });

        return { count: ticketIds.length };
      });

      mockPrisma.seatSection.update.mockImplementation(async (args: any) => {
        const decrementBy = args.data.availableSeats.decrement;
        currentAvailableSeats -= decrementBy;
        return {
          ...mockSection,
          availableSeats: currentAvailableSeats,
        } as any;
      });

      mockPrisma.booking.update.mockImplementation(async (args: any) => {
        const bookingId = args.where.id;
        const userId = bookingId.split("-")[1]; // Extract user id from booking id
        const ticketIds = args.data.tickets.connect.map((c: any) => c.id);

        ticketsReserved[userId] = ticketIds;

        return { id: bookingId, tickets: ticketIds } as any;
      });

      mockPrisma.$transaction.mockImplementation(async (operations) => {
        const results = [];
        for (const op of operations as any) {
          results.push(await op);
        }
        return results;
      });

      // Implement lock acquisition with controlled concurrency
      (LockManager.acquireLock as jest.Mock).mockImplementation(
        async (lockKey: string) => {
          // Small random delay to simulate network latency
          await new Promise((r) =>
            setTimeout(r, Math.floor(Math.random() * 10))
          );

          // Extract user info from the lock key
          const matches = /section:([^:]+):reserve/.exec(lockKey);
          if (matches && matches[1] === sectionId) {
            lockCounter++;
            const userId = `user-${lockCounter}`; // Simulate user identification
            usersWithLocks.push(userId);
            return `lock-token-${userId}`;
          }

          return null; // Failed to get lock
        }
      );

      (LockManager.releaseLock as jest.Mock).mockImplementation(async () => {
        locksReleased++;
        return true;
      });

      // Execute all reservation requests concurrently
      const results = await Promise.allSettled(
        users.map((user) =>
          processReserveHandler(
            mockJob({
              sectionId,
              quantity: user.quantity,
              userId: user.userId,
              bookingId: user.bookingId,
            }) as Job
          )
        )
      );

      // Assertions for high concurrency scenario
      const successfulRequests = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failedRequests = results.filter(
        (r) => r.status === "rejected"
      ).length;

      // We should have exactly 5 successful requests (matching our available tickets)
      expect(successfulRequests).toBe(5);

      // And 5 failed requests
      expect(failedRequests).toBe(5);

      // Available seats should be 0
      expect(currentAvailableSeats).toBe(0);

      // Each ticket should only be assigned to one user
      const allReservedTickets = Object.values(ticketsReserved).flat();
      const uniqueReservedTickets = new Set(allReservedTickets);
      expect(uniqueReservedTickets.size).toBe(allReservedTickets.length);

      // All tickets should be marked as locked
      mockTickets.forEach((ticket) => {
        expect(ticketStatus[ticket.id]).toBe("LOCKED");
      });

      // All locks should be released
      expect(locksReleased).toBe(10); // All 10 attempts should release their locks
    });
  });

  describe("payment-timeout-scenarios", () => {
    beforeEach(() => {
      // Reset the LockManager mock for these tests
      (LockManager.acquireLock as jest.Mock).mockReset();
      (LockManager.acquireLock as jest.Mock).mockImplementation(
        (lockKey: string) => {
          // Always return a valid lock token for any lock request in these tests
          return `mock-lock-token-${lockKey}`;
        }
      );
    });

    it("should release tickets when payment is not completed within timeout", async () => {
      // Mock data
      const userId = "user-payment-timeout";
      const bookingId = "booking-payment-timeout";
      const ticketIds = ["ticket-timeout-1", "ticket-timeout-2"];
      const sectionId = "section-payment";

      // Mock tickets that were previously locked for a payment
      const mockTickets = [
        { id: ticketIds[0], sectionId, status: "LOCKED" },
        { id: ticketIds[1], sectionId, status: "LOCKED" },
      ];

      // Setup mocks
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets as any);
      mockPrisma.ticketLock.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.seatSection.update.mockResolvedValue({
        id: sectionId,
        availableSeats: 52,
      } as any);

      // Execute the release handler (simulating a payment timeout job)
      const result = await processReleaseHandler(
        mockJob({
          ticketIds,
          userId,
          reason: "PAYMENT_TIMEOUT",
        }) as Job
      );

      // Assertions
      expect(LockManager.acquireLock).toHaveBeenCalledWith(
        `section:${sectionId}:release`,
        expect.any(Number)
      );

      expect(mockPrisma.ticketLock.deleteMany).toHaveBeenCalledWith({
        where: {
          ticketId: { in: ticketIds },
          userId,
        },
      });

      expect(mockPrisma.ticket.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ticketIds },
          status: "LOCKED",
        },
        data: {
          status: "AVAILABLE",
        },
      });

      expect(mockPrisma.seatSection.update).toHaveBeenCalledWith({
        where: { id: sectionId },
        data: {
          availableSeats: {
            increment: 2,
          },
        },
      });

      expect(cacheService.invalidateCachePattern).toHaveBeenCalledWith(
        `section:${sectionId}`
      );
      expect(LockManager.releaseLock).toHaveBeenCalled();

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          releasedCount: 2,
        })
      );
    });

    it("should handle expired pending bookings by releasing tickets", async () => {
      // This test simulates the behavior of the booking worker's check-expired-bookings job
      // which handles tickets that need to be released when a booking expires

      // Mock data for an expired booking
      const userId = "user-expired-booking";
      const bookingId = "booking-expired";
      const ticketIds = ["ticket-expired-1", "ticket-expired-2"];
      const sectionId = "section-expired";

      // Mock tickets that were locked for this booking
      const mockTickets = [
        { id: ticketIds[0], sectionId, status: "LOCKED" },
        { id: ticketIds[1], sectionId, status: "LOCKED" },
      ];

      // Setup mocks
      mockPrisma.ticket.findMany.mockResolvedValue(mockTickets as any);
      mockPrisma.ticketLock.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.ticket.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.seatSection.update.mockResolvedValue({
        id: sectionId,
        availableSeats: 25,
      } as any);

      // Execute the release handler (simulating what happens when a booking expires)
      const result = await processReleaseHandler(
        mockJob({
          ticketIds,
          userId,
          reason: "BOOKING_EXPIRED",
        }) as Job
      );

      // Assertions
      expect(mockPrisma.ticket.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ticketIds },
          status: "LOCKED",
        },
        data: {
          status: "AVAILABLE",
        },
      });

      expect(mockPrisma.seatSection.update).toHaveBeenCalledWith({
        where: { id: sectionId },
        data: {
          availableSeats: {
            increment: 2,
          },
        },
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          releasedCount: 2,
        })
      );
    });
  });
});
