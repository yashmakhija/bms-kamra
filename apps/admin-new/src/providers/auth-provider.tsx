import { ReactNode, useEffect } from "react";
import { useAdminAuth } from "../store/admin-auth";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAdminAuth } = useAdminAuth();

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  return <>{children}</>;
}
