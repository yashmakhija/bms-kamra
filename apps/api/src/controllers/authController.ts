import { Request, Response } from "express";
import {
  createUser,
  findUserByEmail,
  findOrCreateGoogleUser,
  findOrCreateUserByPhone,
  createOtpCode,
  verifyOtpCode,
  findUserById,
} from "../services/userService";
import { comparePassword, generateToken } from "../utils/auth";
import { verifyGoogleToken } from "../services/googleService";
import { AuthRequest, LoginResponse } from "../types";

/**
 * Register a new user with email and password
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if required fields are provided
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Create new user
    const user = await createUser(name, email, password);

    // Generate token
    const token = generateToken(user.id);

    // Return user info and token
    const response: LoginResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: null,
        image: user.image,
      },
      token,
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Failed to register user" });
  }
};

/**
 * Login with email and password
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if required fields are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user has password (might be registered via social login)
    if (!user.password) {
      return res.status(401).json({
        message:
          "Account was created with social login. Please use that method to sign in",
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user info and token
    const response: LoginResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
      },
      token,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Failed to login" });
  }
};

/**
 * Login or register with Google
 */
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    // Find or create user
    const user = await findOrCreateGoogleUser(
      googleUser.email,
      googleUser.name,
      googleUser.picture,
      googleUser.sub
    );

    // Generate token
    const token = generateToken(user.id);

    // Return user info and token
    const response: LoginResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
      },
      token,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({ message: "Failed to login with Google" });
  }
};

/**
 * Request OTP for phone login
 */
export const requestPhoneOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Find or create user by phone
    const user = await findOrCreateUserByPhone(phone);

    // Create OTP code
    const { sent, code } = await createOtpCode(user.id, phone);

    if (!sent) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    // Return success response
    // In development, return the code as well for testing
    const response =
      process.env.NODE_ENV === "development"
        ? { message: "OTP sent successfully", code }
        : { message: "OTP sent successfully" };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Request OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

/**
 * Verify OTP for phone login
 */
export const verifyPhoneOtp = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res
        .status(400)
        .json({ message: "Phone number and OTP code are required" });
    }

    // Verify OTP code
    const { verified, userId } = await verifyOtpCode(phone, code);

    if (!verified) {
      return res.status(401).json({ message: "Invalid or expired OTP code" });
    }

    // Get user
    const user = await findUserById(userId as string);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user info and token
    const response: LoginResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
      },
      token,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
};
