import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../store/admin-auth";
import { AdminAuthModal } from "./admin-auth-modal";
import { Shield } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAdminAuth } = useAdminAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const isAdmin = await checkAdminAuth();
      setInitialCheckDone(true);

      if (!isAdmin) {
        setShowAuthModal(true);
      }
    };

    verifyAuth();
  }, [checkAdminAuth]);

  if (isLoading && !initialCheckDone) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
        <p className="text-zinc-500">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAuthenticated && initialCheckDone) {
    return (
      <>
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Admin Access Required
          </h1>
          <p className="text-zinc-500 mb-6 text-center max-w-md">
            You need administrator privileges to access this page.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Sign in as Admin
          </button>
        </div>

        <AdminAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
}
