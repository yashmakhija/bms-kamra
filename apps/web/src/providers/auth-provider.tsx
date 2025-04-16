import { ReactNode, useEffect } from "react";
import { useAuthStore } from "../store/auth";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider component
 * Handles refreshing user data on app start
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, refreshUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
    }
  }, [isAuthenticated, refreshUser]);

  return <>{children}</>;
}
