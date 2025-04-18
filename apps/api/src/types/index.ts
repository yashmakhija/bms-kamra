import { Request } from "express";
import { User, Admin } from "@repo/database";

export type AdminRole = "SUPER_ADMIN" | "EDITOR";

export interface AuthRequest extends Request {
  user?: User & {
    admin?: Admin | null;
  };
  userRole?: AdminRole | null;
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

export interface LoginResponse {
  token: string;
  user: Pick<User, "id" | "name" | "email" | "phone" | "image"> & {
    isAdmin: boolean;
    role?: AdminRole | null;
  };
}

export interface PhoneLoginRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}
