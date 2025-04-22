import { ReactNode, useEffect } from "react";
import { useAuthStore } from "../store/auth";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider component
 * Handles authentication verification on app startup
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, verifyAuth, verifyChecked } = useAuthStore();

  useEffect(() => {
    // Verify authentication status on component mount
    if (!verifyChecked) {
      verifyAuth();
    }
    
  }, [verifyAuth, verifyChecked]);

  return <>{children}</>;
}
