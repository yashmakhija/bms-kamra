import { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import { Menu } from "lucide-react";
import { AdminAuthModal } from "../../auth/admin-auth-modal";
import { UserButton } from "../../auth/user-button";
import { ThemeToggle } from "../../ui/theme-toggle";

export function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLoginClick = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <>
      <nav className="h-16 flex items-center px-4 fixed w-full top-0 z-8 bg-[#171717]/80 backdrop-blur-sm dark:bg-black/80">
        <div className="container mx-auto flex justify-between items-center">
          <div className="md:hidden">
            <Button
              variant="ghost"
              className="text-zinc-800 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 p-2"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 md:static md:left-0 md:transform-none">
            <Link to="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="The Kunal Kamra App"
                className="h-12 w-12"
              />
            </Link>
          </div>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/dashboard"
              className={`text-zinc-800 dark:text-white hover:text-zinc-600 dark:hover:text-white/80 ${
                location.pathname === "/dashboard"
                  ? "border-b-2 border-purple-500"
                  : ""
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/shows"
              className={`text-zinc-800 dark:text-white hover:text-zinc-600 dark:hover:text-white/80 ${
                location.pathname === "/shows"
                  ? "border-b-2 border-purple-500"
                  : ""
              }`}
            >
              Shows
            </Link>
            <Link
              to="/tickets"
              className={`text-zinc-800 dark:text-white hover:text-zinc-600 dark:hover:text-white/80 ${
                location.pathname === "/tickets"
                  ? "border-b-2 border-purple-500"
                  : ""
              }`}
            >
              Tickets
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
            <UserButton onLoginClick={handleLoginClick} />
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-white dark:bg-zinc-900 pt-16 px-4 md:hidden">
          <div className="space-y-4 py-5">
            <Link
              to="/dashboard"
              className={`block py-2 text-zinc-800 dark:text-white font-medium ${
                location.pathname === "/dashboard"
                  ? "text-purple-600 dark:text-purple-400"
                  : ""
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/shows"
              className={`block py-2 text-zinc-800 dark:text-white font-medium ${
                location.pathname === "/shows"
                  ? "text-purple-600 dark:text-purple-400"
                  : ""
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Shows
            </Link>
            <Link
              to="/tickets"
              className={`block py-2 text-zinc-800 dark:text-white font-medium ${
                location.pathname === "/tickets"
                  ? "text-purple-600 dark:text-purple-400"
                  : ""
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Tickets
            </Link>
          </div>
        </div>
      )}

      <AdminAuthModal isOpen={isAuthModalOpen} onClose={handleCloseModal} />
    </>
  );
}
