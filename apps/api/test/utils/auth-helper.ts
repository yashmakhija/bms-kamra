import * as jwt from "jsonwebtoken";
import { config } from "../../src/config";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

// Create a test user
export const createTestUser = (isAdmin: boolean = false): TestUser => {
  return {
    id: `user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    name: "Test User",
    isAdmin,
  };
};

// Generate a valid JWT token for testing
export const generateAuthToken = (user: TestUser): string => {
  const payload = {
    id: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  };

  return jwt.sign(payload, config?.auth?.jwtSecret || "test_secret", {
    expiresIn: "1h",
  });
};

// Get auth headers for test requests
export const getAuthHeader = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
  };
};
