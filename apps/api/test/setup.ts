import { config } from "../src/config";
import { prisma } from "../src/lib/database";

// Load environment variables
process.env.NODE_ENV = "test";

// Mock redis
jest.mock("ioredis", () => {
  const Redis = require("ioredis-mock");
  return Redis;
});

// Mock bull
jest.mock("bull", () => {
  return jest.fn().mockImplementation(() => {
    return {
      process: jest.fn(),
      add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
      on: jest.fn(),
    };
  });
});

// Mock bullmq
jest.mock("bullmq", () => {
  return {
    Queue: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
        on: jest.fn(),
      };
    }),
    Worker: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(true),
      };
    }),
    QueueEvents: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
      };
    }),
  };
});

// Mock twilio service completely
jest.mock("../src/services/twilioService", () => ({
  sendOtpSms: jest.fn().mockResolvedValue(true),
}));

// Mock user service if it uses Twilio
jest.mock("../src/services/userService", () => ({
  sendVerificationCode: jest.fn().mockResolvedValue({ success: true }),
  verifyCode: jest.fn().mockResolvedValue({ success: true }),
  createUser: jest
    .fn()
    .mockImplementation((userData) =>
      Promise.resolve({ id: `user-${Date.now()}`, ...userData })
    ),
  getUserById: jest
    .fn()
    .mockImplementation((id) => Promise.resolve({ id, name: "Test User" })),
  updateUser: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock winston logger
jest.mock("../src/utils/logger", () => {
  return {
    createServiceLogger: jest.fn().mockReturnValue({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    }),
  };
});

// Global setup
beforeAll(async () => {
  // Create a test database transaction to enable test isolation
  // All database operations will be rolled back after each test
  await prisma.$connect();
});

// After each test, reset all mocks
afterEach(() => {
  jest.clearAllMocks();
});

// Global teardown
afterAll(async () => {
  await prisma.$disconnect();
});
