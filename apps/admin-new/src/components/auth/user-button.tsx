import { useState } from "react";
import { useAdminAuth } from "../../store/admin-auth";
import { ShieldCheck, User, LogOut } from "lucide-react";

interface UserButtonProps {
  onLoginClick: () => void;
}

export function UserButton({ onLoginClick }: UserButtonProps) {
  const { admin, isAuthenticated, logout } = useAdminAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => setShowDropdown(!showDropdown);
  const closeDropdown = () => setShowDropdown(false);

  const handleLogout = () => {
    logout();
    closeDropdown();
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={onLoginClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors shadow-sm"
      >
        <ShieldCheck className="h-4 w-4" />
        <span>Admin Login</span>
      </button>
    );
  }

  const initials = admin?.name
    ? admin.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "AD";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 focus:outline-none"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-medium">
          {initials}
        </div>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={closeDropdown}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg overflow-hidden z-20">
            <div className="py-3 px-4 bg-purple-50 border-b border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {initials}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {admin?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Administrator
                  </p>
                </div>
              </div>
            </div>
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-2 text-gray-500" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
