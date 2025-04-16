import axios, { AxiosError, AxiosInstance } from "axios";
import { API_CONFIG, ENDPOINTS, STORAGE_KEYS } from "./config";
import {
  AuthResponse,
  ChangePasswordRequest,
  DeleteAccountRequest,
  GoogleLoginRequest,
  LoginRequest,
  PhoneOtpRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
  VerifyOtpRequest,
} from "./types";

/**
 * API Client for BMS application
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    // Add authentication interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth methods
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.auth.register,
      data
    );
    this.handleAuthResponse(response.data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.auth.login,
      data
    );
    this.handleAuthResponse(response.data);
    return response.data;
  }

  async googleLogin(data: GoogleLoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.auth.google,
      data
    );
    this.handleAuthResponse(response.data);
    return response.data;
  }

  async requestPhoneOtp(
    data: PhoneOtpRequest
  ): Promise<{ message: string; code?: string }> {
    const response = await this.client.post<{ message: string; code?: string }>(
      ENDPOINTS.auth.phoneRequestOtp,
      data
    );
    return response.data;
  }

  async verifyPhoneOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.auth.phoneVerifyOtp,
      data
    );
    this.handleAuthResponse(response.data);
    return response.data;
  }

  // User methods
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>(ENDPOINTS.user.me);
    return response.data;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await this.client.put<User>(ENDPOINTS.user.profile, data);
    return response.data;
  }

  async changePassword(
    data: ChangePasswordRequest
  ): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>(
      ENDPOINTS.user.changePassword,
      data
    );
    return response.data;
  }

  async deleteAccount(
    data: DeleteAccountRequest
  ): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      ENDPOINTS.user.deleteAccount,
      { data }
    );
    return response.data;
  }

  // Auth utilities
  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(STORAGE_KEYS.token));
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
  }

  private handleAuthResponse(data: AuthResponse): void {
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
    }
  }

  getStoredUser(): User | null {
    const userJson = localStorage.getItem(STORAGE_KEYS.user);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
