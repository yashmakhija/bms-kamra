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
  return "https://kunal-api.classicoder.com/api";
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
    create: "/venues",
    update: (id: string) => `/venues/${id}`,
    delete: (id: string) => `/venues/${id}`,
  },
  shows: {
    getAll: "/shows",
    getById: (id: string) => `/shows/${id}`,
    create: "/shows",
    update: (id: string) => `/shows/${id}`,
    delete: (id: string) => `/shows/${id}`,
    createEvent: "/shows/events",
    createShowtime: "/shows/showtimes",
    createSection: "/shows/sections",
    publish: (id: string) => `/shows/${id}/publish`,
  },
  events: {
    getByShow: (showId: string) => `/shows/${showId}/events`,
    getById: (id: string) => `/events/${id}`,
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
  },
  showtimes: {
    getByEvent: (eventId: string) => `/events/${eventId}/showtimes`,
    getById: (id: string) => `/showtimes/${id}`,
    update: (id: string) => `/showtimes/${id}`,
    delete: (id: string) => `/showtimes/${id}`,
  },
  categories: {
    getAll: "/categories",
    getById: (id: string) => `/categories/${id}`,
    getByType: (type: string) => `/categories/type/${type}`,
    create: "/categories",
    update: (id: string) => `/categories/${id}`,
    delete: (id: string) => `/categories/${id}`,
  },
  priceTiers: {
    getAll: "/price-tiers",
    getById: (id: string) => `/price-tiers/${id}`,
    getByShow: (showId: string) => `/price-tiers/show/${showId}`,
    create: "/price-tiers",
    update: (id: string) => `/price-tiers/${id}`,
    delete: (id: string) => `/price-tiers/${id}`,
  },
  seatSections: {
    getById: (id: string) => `/seat-sections/${id}`,
    getByShowtime: (showtimeId: string) =>
      `/seat-sections/showtime/${showtimeId}`,
    create: "/seat-sections",
    update: (id: string) => `/seat-sections/${id}`,
    delete: (id: string) => `/seat-sections/${id}`,
  },
  admin: {
    getAllBookings: "/admin/bookings",
    getAllUsers: "/admin/users",
    getDashboardStats: "/admin/dashboard/stats",
    getBookingAnalytics: "/admin/analytics/bookings",
    getRevenueStats: "/admin/analytics/revenue",
    getUserStats: "/admin/analytics/users",
  },
};
