import { create } from "zustand";
import {
  apiClient,
  User,
  LoginRequest,
  RegisterRequest,
} from "@repo/api-client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verifyChecked: boolean; // Flag to track if auth has been verified

  // Auth actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithPhone: (phone: string, otpCode: string) => Promise<void>;
  requestOtp: (phone: string) => Promise<{ message: string; code?: string }>;
  refreshUser: () => Promise<void>;
  verifyAuth: () => Promise<boolean>; // New method to verify authentication

  // UI state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: apiClient.getStoredUser(),
  isAuthenticated: apiClient.isAuthenticated(),
  isLoading: false,
  error: null,
  verifyChecked: false, 

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.login(credentials);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        verifyChecked: true, 
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Login failed",
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.register(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        verifyChecked: true, // Mark as verified after successful registration
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Registration failed",
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    apiClient.logout();
    set({
      user: null,
      isAuthenticated: false,
      verifyChecked: true, // Mark as verified after logout
    });
  },

  loginWithGoogle: async (idToken) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.googleLogin({ idToken });
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        verifyChecked: true, // Mark as verified after successful login
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Google login failed",
        isLoading: false,
      });
      throw error;
    }
  },

  requestOtp: async (phone) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.requestPhoneOtp({ phone });
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to send OTP",
        isLoading: false,
      });
      throw error;
    }
  },

  loginWithPhone: async (phone, otpCode) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.verifyPhoneOtp({ phone, code: otpCode });
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        verifyChecked: true, // Mark as verified after successful login
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Phone verification failed",
        isLoading: false,
      });
      throw error;
    }
  },

  refreshUser: async () => {
    if (!get().isAuthenticated) return;

    try {
      set({ isLoading: true });
      const user = await apiClient.getCurrentUser();
      set({ user, isLoading: false });
    } catch (error: any) {
      // If 401, logout user
      if (error.response?.status === 401) {
        get().logout();
      }
      set({ isLoading: false });
    }
  },

  // New method to verify authentication with the server
  verifyAuth: async () => {
    try {
      set({ isLoading: true });
      const { authenticated, user } = await apiClient.verifyAuth();

      // Update the auth state based on server response
      set({
        isAuthenticated: authenticated,
        user: authenticated ? user || get().user : null,
        isLoading: false,
        verifyChecked: true, // Mark verification as completed
      });

      return authenticated;
    } catch (error) {
      // If verification fails, assume not authenticated
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        verifyChecked: true, // Mark verification as completed
      });
      return false;
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
