/**
 * API Configuration
 */
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

/**
 * Helper function to get API base URL that works in both Node.js and browser environments
 */
function getApiBaseUrl(): string {
  // Check if we're in a Node.js environment
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.VITE_API_URL
  ) {
    return process.env.VITE_API_URL;
  }

  // Check if we're in a browser environment with Vite
  if (typeof window !== "undefined") {
    // @ts-ignore - Vite-specific environment variable
    if (window.ENV_VITE_API_URL) {
      // @ts-ignore
      return window.ENV_VITE_API_URL;
    }
  }

  // Default fallback
  return "https://8dba-2405-201-682b-39a8-50d8-eea6-c674-2ec3.ngrok-free.app/api";
}

/**
 * Authentication storage keys
 */
export const STORAGE_KEYS = {
  token: "bms_auth_token",
  user: "bms_user",
};

/**
 * API endpoints
 */
export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    google: "/auth/google",
    phoneRequestOtp: "/auth/phone/request-otp",
    phoneVerifyOtp: "/auth/phone/verify-otp",
  },
  user: {
    me: "/users/me",
    profile: "/users/profile",
    changePassword: "/users/change-password",
    deleteAccount: "/users/account",
  },
};
