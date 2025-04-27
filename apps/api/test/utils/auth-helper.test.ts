import * as jwt from "jsonwebtoken";
import {
  createTestUser,
  generateAuthToken,
  getAuthHeader,
} from "./auth-helper";
import { config } from "../../src/config";

describe("Auth Helper", () => {
  describe("createTestUser", () => {
    it("should create a regular user by default", () => {
      const user = createTestUser();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.name).toBe("Test User");
      expect(user.isAdmin).toBe(false);
    });

    it("should create an admin user when specified", () => {
      const user = createTestUser(true);
      expect(user.isAdmin).toBe(true);
    });
  });

  describe("generateAuthToken", () => {
    it("should generate a valid JWT token", () => {
      const user = createTestUser();
      const token = generateAuthToken(user);

      expect(token).toBeDefined();

      // Verify token contents
      const decoded = jwt.verify(
        token,
        config?.auth?.jwtSecret || "test_secret"
      ) as any;
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.isAdmin).toBe(user.isAdmin);
    });
  });

  describe("getAuthHeader", () => {
    it("should return correct authorization header", () => {
      const token = "test-token";
      const headers = getAuthHeader(token);

      expect(headers).toEqual({
        Authorization: "Bearer test-token",
      });
    });
  });
});
