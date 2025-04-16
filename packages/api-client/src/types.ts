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
