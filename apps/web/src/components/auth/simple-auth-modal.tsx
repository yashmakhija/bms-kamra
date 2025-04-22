import { useState, useEffect } from "react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { PhoneLoginForm } from "./phone-login-form";
import { GoogleLoginButton } from "./google-login-button";
import { X } from "lucide-react";

interface SimpleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function SimpleAuthModal({
  isOpen,
  onClose,
  className,
}: SimpleAuthModalProps) {
  const [activeTab, setActiveTab] = useState<string>("login");

  useEffect(() => {
    console.log("SimpleAuthModal isOpen changed:", isOpen);

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
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${className}`}>
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
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            Welcome Back!
          </h2>
          <p className="text-gray-500 text-sm">
            Sign in to your account or create a new one
          </p>
        </div>

        {/* Tabs */}
        <div className="w-full">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              className={`flex-1 py-2 text-center rounded-md transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-white text-[#e31001] font-medium shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 text-center rounded-md transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-white text-[#e31001] font-medium shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("register")}
            >
              Register
            </button>
          </div>

          {/* Login Content */}
          {activeTab === "login" && (
            <div className="space-y-5">
              <LoginForm onSuccess={handleSuccess} />

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                <GoogleLoginButton onSuccess={handleSuccess} />
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5 text-sm shadow-sm hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveTab("phone")}
                >
                  <svg
                    className="h-5 w-5 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 18H12.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Login with Phone
                </button>
              </div>
            </div>
          )}

          {/* Register Content */}
          {activeTab === "register" && (
            <div className="space-y-5">
              <RegisterForm onSuccess={handleSuccess} />

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                <GoogleLoginButton onSuccess={handleSuccess} />
              </div>
            </div>
          )}

          {/* Phone Content */}
          {activeTab === "phone" && (
            <div className="space-y-5">
              <PhoneLoginForm
                onSuccess={handleSuccess}
                onBack={() => setActiveTab("login")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
