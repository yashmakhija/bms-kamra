import * as jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config";
import { JwtPayload } from "../types";

type JwtSignCallback = (err: Error | null, token: string) => void;

export const generateToken = (userId: string): string => {
  const token = jsonwebtoken.sign({ userId } as any, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  } as any);

  return token;
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jsonwebtoken.verify(token, config.auth.jwtSecret) as any;

    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateOtpCode = (length: number = 6): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
