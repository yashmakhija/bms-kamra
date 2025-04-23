import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  Menu,
  Search,
  X,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import { SimpleAuthModal } from "../../auth/simple-auth-modal";
import { Input } from "@repo/ui/components/ui/input";
import { cn } from "@repo/ui/utils";
import { useAuthStore } from "../../../store/auth";

// Define navigation links
const navLinks = [
  { title: "Home", href: "/" },
  { title: "Tickets", href: "/tickets" },
  { title: "Gallery", href: "/gallery" },
  { title: "Episodes", href: "/latest-uploads" },
  { title: "Podcasts", href: "/podcasts" },
  { title: "Merch", href: "/merch" },
];

export function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Get authentication state from store
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLoginClick = useCallback(() => {
    console.log(
      "Login button clicked in Navbar, current state:",
      isAuthModalOpen
    );
    setIsAuthModalOpen(true);
    console.log("Auth modal state after setting:", true);
  }, [isAuthModalOpen]);

  const handleCloseModal = useCallback(() => {
    console.log("Closing auth modal");
    setIsAuthModalOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
    setIsSearchActive(false);
    setIsProfileOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchActive((prev) => !prev);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, []);

  const toggleProfile = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent event bubbling
    setIsProfileOpen((prev) => !prev);
    setIsMenuOpen(false);
  }, []);

  // Enhanced click handler for profile button with stopPropagation
  const handleProfileClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleProfile(e);
    },
    [toggleProfile]
  );

  const handleLogout = useCallback(() => {
    logout();
    setIsProfileOpen(false);
  }, [logout]);

  // Close profile dropdown when clicking outside - improved handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    // Add the event listener only when dropdown is open
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isProfileOpen]); // Only re-run when isProfileOpen changes

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="h-16 top-0 flex items-center px-4 fixed w-full z-40 bg-[#171717]">
        <div className="container mx-auto flex justify-between items-center">
          {/* Left side */}
          <div className="flex items-center gap-8">
            {/* Hamburger Menu for Mobile & Tablet */}
            <button
              onClick={toggleMenu}
              className="lg:hidden flex flex-col justify-center items-center space-y-1.5"
            >
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
            </button>

            {/* Logo - Only visible on large screens */}
            <Link to="/" className="hidden cursor-pointer lg:flex items-center">
              <a href="/">
                <img
                  src="/logo.png"
                  alt="The Kunal Kamra Show"
                  className="h-12 w-12"
                />
              </a>
            </Link>

            {/* Navigation Links - Only visible on large screens */}
            <div className="hidden lg:flex space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  to={link.href}
                  className={cn(
                    "text-sm text-neutral-300 hover:text-white transition-colors",
                    link.title === "Tickets" && "text-[#aee301] font-medium"
                  )}
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4 md:space-x-2 lg:space-x-4">
            <div className="hidden md:block">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search"
                  className="w-60 md:w-48 lg:w-80 bg-neutral-800 border-neutral-700 rounded-xl outline outline-neutral-600 inline-flex justify-start items-center gap-3 pl-10 py-1.5 h-10 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-50 h-4 w-4" />
              </div>
            </div>

            {/* Login button for non-authenticated users */}
            {!isAuthenticated ? (
              <Button
                className="bg-[#e31001] hover:bg-[#c50e00] text-white px-4 py-2 h-10 rounded-md"
                onClick={handleLoginClick}
              >
                Login
              </Button>
            ) : (
              /* Profile section for authenticated users */
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  className="flex items-center cursor-pointer gap-2 text-white hover:bg-neutral-800 rounded-md px-3 h-10"
                  onClick={handleProfileClick}
                >
                  <div className="h-8 w-8 rounded-full bg-[#e31001] flex items-center justify-center text-white overflow-hidden">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <span className="hidden md:inline-block text-sm font-medium truncate max-w-[100px]">
                    {user?.name || "User"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform",
                      isProfileOpen && "rotate-180"
                    )}
                  />
                </Button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="py-2 px-4 border-b border-neutral-700">
                      <p className="text-sm font-medium text-white truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {user?.email || ""}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 w-full text-left"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User size={16} />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/bookings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 w-full text-left"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Calendar size={16} />
                        <span>My Tickets</span>
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 w-full text-left"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </Link>
                    </div>
                    <div className="border-t border-neutral-700">
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-neutral-700 w-full text-left"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-[#171717] border-b border-neutral-800 lg:hidden">
            <div className="flex flex-col p-4">
              {/* Search Input for Mobile */}
              <div className="relative mb-4 md:hidden">
                <Input
                  type="search"
                  placeholder="Search"
                  className="w-full bg-neutral-800 border-neutral-700 rounded-xl outline outline-neutral-600 inline-flex justify-start items-center gap-3 pl-10 py-1.5 h-10 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-50 h-4 w-4" />
              </div>

              {/* User Info for Mobile - Only show if authenticated */}
              {isAuthenticated && (
                <div className="mb-4 py-3 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#e31001] flex items-center justify-center text-white">
                      {user?.image ? (
                        <img
                          src={user.image}
                          alt={user.name || "User"}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  to={link.href}
                  className={cn(
                    "py-3 text-neutral-300 hover:text-white border-b border-neutral-800 last:border-0",
                    link.title === "Tickets" && "text-[#aee301]"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.title}
                </Link>
              ))}

              {/* User Account Links - Only show if authenticated */}
              {isAuthenticated && (
                <div className="mt-2">
                  <Link
                    to="/profile"
                    className="py-3 text-neutral-300 hover:text-white border-b border-neutral-800 flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/bookings"
                    className="py-3 text-neutral-300 hover:text-white border-b border-neutral-800 flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar size={16} />
                    <span>My Bookings</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="py-3 text-neutral-300 hover:text-white border-b border-neutral-800 flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <button
                    className="py-3 text-red-400 hover:text-red-300 w-full text-left flex items-center gap-2"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Add debugging information */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          background: "rgba(0,0,0,0.5)",
          color: "white",
          padding: "2px 5px",
          fontSize: "10px",
          zIndex: 9999,
          display: "none",
        }}
      >
        Modal open: {isAuthModalOpen ? "true" : "false"}
      </div>

      <SimpleAuthModal isOpen={isAuthModalOpen} onClose={handleCloseModal} />
    </>
  );
}
