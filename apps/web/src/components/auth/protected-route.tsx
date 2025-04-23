import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Protected Route Component
 * Ensures that routes are only accessible to authenticated users
 * Redirects to login or another specified page if not authenticated
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, verifyChecked, verifyAuth } =
    useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // If we haven't verified auth yet, do it now
    if (!verifyChecked) {
      verifyAuth();
    }
  }, [verifyAuth, verifyChecked]);

  // Show loading state while checking authentication
  if (isLoading || !verifyChecked) {
    return (
      <div className="flex flex-col items-center justify-center bg-neutral-900 min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
        <p className="text-lg text-neutral-50">Checking authorization...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}
