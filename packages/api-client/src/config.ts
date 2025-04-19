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
  return "http://localhost:3091/api";
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
    verify: "/auth/verify",
  },
  user: {
    me: "/users/me",
    profile: "/users/profile",
    changePassword: "/users/change-password",
    deleteAccount: "/users/account",
  },
  booking: {
    create: "/bookings",
    getUserBookings: "/bookings/my-bookings",
    getById: (id: string) => `/bookings/${id}`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
    payment: (id: string) => `/bookings/${id}/payment`,
  },
  razorpay: {
    status: "/razorpay/status",
    createOrder: (bookingId: string) => `/razorpay/orders/${bookingId}`,
    verifyPayment: (bookingId: string) => `/razorpay/verify/${bookingId}`,
    webhook: "/razorpay/webhook",
  },
  venues: {
    getAll: "/venues",
    getById: (id: string) => `/venues/${id}`,
  },
  shows: {
    getAll: "/shows",
    getById: (id: string) => `/shows/${id}`,
    create: "/shows",
    update: (id: string) => `/shows/${id}`,
    delete: (id: string) => `/shows/${id}`,
    createEvent: "/shows/events",
    createShowtime: "/shows/showtimes",
  },
  categories: {
    getAll: "/categories",
    getById: (id: string) => `/categories/${id}`,
    getByType: (type: string) => `/categories/type/${type}`,
    create: "/categories",
  },
  priceTiers: {
    getAll: "/price-tiers",
    getById: (id: string) => `/price-tiers/${id}`,
    getByShow: (showId: string) => `/price-tiers/show/${showId}`,
    create: "/shows/sections",
  },
  seatSections: {
    getByShowtime: (showtimeId: string) =>
      `/seat-sections/showtime/${showtimeId}`,
    create: "/seat-sections",
  },
};
