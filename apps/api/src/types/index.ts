import { Request } from "express";
import { User, Admin } from "@repo/database";

/**
 * Admin role types
 */
export type AdminRole = "SUPER_ADMIN" | "EDITOR";

/**
 * Extended request type that includes authenticated user
 * Extends Express.Request and overrides the user property
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
    isAdmin?: boolean;
    [key: string]: any;
  };
  isAdmin?: boolean;
}

export interface GoogleTokenPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export interface JwtPayload {
  userId: string;
  role?: AdminRole | null;
  isAdmin?: boolean;
}

/**
 * Login response type
 */
export interface LoginResponse {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    image: string | null;
    isAdmin: boolean;
    role: AdminRole | null;
  };
  token: string;
}

export interface PhoneLoginRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Pagination result
 */
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
