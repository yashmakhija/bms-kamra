/**
 * User interface
 */
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  emailVerified: Date | null;
  phoneVerified: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  isAdmin?: boolean;
  role?: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Registration request data
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Login request data
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Google login request data
 */
export interface GoogleLoginRequest {
  idToken: string;
}

/**
 * Phone OTP request data
 */
export interface PhoneOtpRequest {
  phone: string;
}

/**
 * Phone OTP verification request data
 */
export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

/**
 * Update profile request data
 */
export interface UpdateProfileRequest {
  name?: string;
  image?: string;
}

/**
 * Change password request data
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Delete account request data
 */
export interface DeleteAccountRequest {
  password?: string;
}

/**
 * API Error
 */
export interface ApiError {
  message: string;
  errors?: { msg: string; param: string }[];
}

/**
 * Booking related types
 */
export interface Booking {
  id: string;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  paymentDate?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tickets: Ticket[];
}

export interface Ticket {
  id: string;
  seatNumber?: string;
  code: string;
  status: TicketStatus;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sectionId: string;
}

export type BookingStatus =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "CANCELED"
  | "REFUNDED";
export type TicketStatus =
  | "AVAILABLE"
  | "LOCKED"
  | "RESERVED"
  | "SOLD"
  | "CANCELED";
export type PaymentMethod =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "UPI"
  | "PAYPAL"
  | "BANK_TRANSFER"
  | "WALLET"
  | "RAZORPAY";

/**
 * Create booking request
 */
export interface CreateBookingRequest {
  showtimeId: string;
  sectionId: string;
  quantity: number;
}

/**
 * Payment related types
 */
export interface ProcessPaymentRequest {
  paymentMethod: PaymentMethod;
  paymentId: string;
}

/**
 * Razorpay related types
 */
export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface RazorpayVerifyRequest {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface RazorpayStatusResponse {
  status: "configured" | "not_configured";
  keyId: string | null;
  webhookConfigured: boolean;
  environment: string;
}

export interface VerifyAuthResponse {
  authenticated: boolean;
  user?: User;
}

// Show related types
export interface Show {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  ageLimit?: number;
  language?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  venueId: string;
  venue?: Venue;
  categories?: Category[];
  events?: Event[];
}

export interface ShowCreateInput {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  ageLimit?: number;
  language?: string;
  venueId: string;
  categoryIds?: string[];
}

export interface Event {
  id: string;
  date: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  showId: string;
  show?: Show;
  showtimes?: Showtime[];
}

export interface EventCreateInput {
  showId: string;
  date: string; // ISO date string
}

export interface Showtime {
  id: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  eventId: string;
  event?: Event;
  seatSections?: SeatSection[];
}

export interface ShowtimeCreateInput {
  eventId: string;
  startTime: string; // ISO date-time string
  endTime: string; // ISO date-time string
}

export interface Category {
  id: string;
  name: string;
  type: string;
  description?: string;
  capacity?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryCreateInput {
  name: string;
  type: string;
  description?: string;
  capacity?: number;
}

export interface PriceTier {
  id: string;
  price: number;
  currency: string;
  description?: string;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  showId: string;
  categoryId: string;
  category?: Category;
  show?: Show;
}

export interface PriceTierCreateInput {
  showId: string;
  categoryId: string;
  price: number;
  currency?: string;
  description?: string;
  capacity: number;
}

export interface SeatSection {
  id: string;
  name: string;
  availableSeats: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  showtimeId: string;
  showtime?: Showtime;
  priceTierId: string;
  priceTier?: PriceTier;
}

export interface SeatSectionCreateInput {
  showtimeId: string;
  priceTierId: string;
  name: string;
  availableSeats: number;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  capacity?: number;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
