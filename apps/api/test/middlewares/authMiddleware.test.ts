import { Request, Response, NextFunction } from "express";
import * as jsonwebtoken from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import {
  authMiddleware as authRequired,
  isAdminMiddleware as adminRequired,
} from "../../src/middlewares/authMiddleware";
import { createMockUser, createMockAdminUser } from "../fixtures/user.fixtures";
import { mockPrisma } from "../utils/db-helper";

// Extend Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      isAdmin?: boolean;
    }
  }
}

// Setup mock response
const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

// Setup mock next function
const mockNext: NextFunction = jest.fn();

// Mock JWT secret
const JWT_SECRET = "test-secret";

// Mock config
jest.mock("../../src/config", () => ({
  config: {
    auth: {
      jwtSecret: "test-secret",
      jwtExpiresIn: "1h",
    },
  },
}));

// Mock auth utils
jest.mock("../../src/utils/auth", () => ({
  verifyToken: jest.fn().mockImplementation((token) => {
    try {
      const decoded = jsonwebtoken.verify(token, JWT_SECRET);
      return {
        userId: typeof decoded === "object" ? (decoded as JwtPayload).id : null,
      };
    } catch (error) {
      return null;
    }
  }),
}));

// Mock user service
jest.mock("../../src/services/userService", () => ({
  findUserById: jest.fn(),
  getUserAdminRole: jest.fn(),
}));

// Import mocked functions for test setup
import { findUserById } from "../../src/services/userService";

describe("Auth Middleware", () => {
  describe("authRequired", () => {
    it("should return 401 if no token is provided", async () => {
      const req: Partial<Request> = {
        headers: {},
        path: "/test",
        method: "GET",
      };
      const res = mockResponse();

      await authRequired(req as Request, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 if token is invalid", async () => {
      const req: Partial<Request> = {
        headers: {
          authorization: "Bearer invalid-token",
        },
        path: "/test",
        method: "GET",
      };
      const res = mockResponse();

      await authRequired(req as Request, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should set req.user and call next() if token is valid", async () => {
      const mockUser = createMockUser();
      const token = jsonwebtoken.sign({ id: mockUser.id }, JWT_SECRET);

      const req: Partial<Request> = {
        headers: {
          authorization: `Bearer ${token}`,
        },
        path: "/test",
        method: "GET",
      };
      const res = mockResponse();

      // Mock user service to return our mock user
      (findUserById as jest.Mock).mockResolvedValue({
        ...mockUser,
        admin: null,
      });

      await authRequired(req as Request, res, mockNext);

      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(mockUser.id);
      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 401 if user is not found", async () => {
      const userId = "non-existent-user";
      const token = jsonwebtoken.sign({ id: userId }, JWT_SECRET);

      const req: Partial<Request> = {
        headers: {
          authorization: `Bearer ${token}`,
        },
        path: "/test",
        method: "GET",
      };
      const res = mockResponse();

      // Mock user service to return null (user not found)
      (findUserById as jest.Mock).mockResolvedValue(null);

      await authRequired(req as Request, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("adminRequired", () => {
    it("should return 403 if user is not an admin", async () => {
      const mockUser = createMockUser();

      const req = {
        user: {
          ...mockUser,
          isAdmin: false,
        },
        isAdmin: false,
      } as Request;
      const res = mockResponse();

      await adminRequired(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next() if user is an admin", async () => {
      const mockAdminUser = createMockAdminUser();

      const req = {
        user: {
          ...mockAdminUser,
          isAdmin: true,
          role: "EDITOR",
        },
        isAdmin: true,
      } as Request;
      const res = mockResponse();

      await adminRequired(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
