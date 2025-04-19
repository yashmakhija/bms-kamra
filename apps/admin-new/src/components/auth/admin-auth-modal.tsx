import { useEffect } from "react";
import { AdminLoginForm } from "./admin-login-form";
import { X, ShieldAlert } from "lucide-react";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminAuthModal({ isOpen, onClose }: AdminAuthModalProps) {
  useEffect(() => {
    // Add event listener to handle ESC key
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl w-full max-w-md p-8 mx-4 shadow-2xl transform transition-all duration-300 scale-100 opacity-100">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
            <ShieldAlert className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            Admin Access
          </h2>
          <p className="text-gray-500 text-sm">
            Please sign in with your admin credentials
          </p>
        </div>

        {/* Admin Login Form */}
        <AdminLoginForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
