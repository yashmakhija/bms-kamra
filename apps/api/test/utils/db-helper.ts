import { PrismaClient } from "@repo/database";
import { mockDeep, mockReset } from "jest-mock-extended";

// Create a mock instance of Prisma client for testing
export const mockPrisma = mockDeep<PrismaClient>();

// Mock the database module
jest.mock("../../src/lib/database", () => ({
  prisma: mockPrisma,
  getDbClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Reset the mock before each test
beforeEach(() => {
  mockReset(mockPrisma);
});

// Helper to create a transaction context that will be rolled back
export const createTestDbContext = async () => {
  return mockPrisma;
};
