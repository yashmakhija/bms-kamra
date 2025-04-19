import { create } from "zustand";
import { apiClient, User, LoginRequest } from "@repo/api-client";

interface AdminAuthState {
  admin: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAdminAuth: () => Promise<boolean>;

  clearError: () => void;
}

export const useAdminAuth = create<AdminAuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.login(credentials);

      // Verify the user has admin privileges
      if (!response.user.isAdmin) {
        set({
          isLoading: false,
          error: "Access denied. Admin privileges required.",
          isAuthenticated: false,
          admin: null,
        });
        apiClient.logout();
        return;
      }

      set({
        admin: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Login failed",
        isLoading: false,
        isAuthenticated: false,
        admin: null,
      });
    }
  },

  logout: () => {
    apiClient.logout();
    set({ admin: null, isAuthenticated: false });
  },

  checkAdminAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.verifyAuth();

      if (response.authenticated && response.user?.isAdmin) {
        set({
          admin: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        // If user is authenticated but not an admin, log them out
        if (response.authenticated) {
          apiClient.logout();
        }

        set({
          admin: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      set({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
