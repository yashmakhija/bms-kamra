import { Request } from "express";
import { User } from "@repo/database";

export interface AuthRequest extends Request {
  user?: User;
}

export interface GoogleTokenPayload {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google's user ID
}

export interface JwtPayload {
  userId: string;
}

export interface LoginResponse {
  token: string;
  user: Pick<User, "id" | "name" | "email" | "phone" | "image">;
}

export interface PhoneLoginRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}
