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
    setIsAuthModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isProfileOpen]);

  return (
    <>
      {/* Desktop Navbar */}
      <div className="absolute top-0 left-0 w-full z-50 p-4 pointer-events-none">
        {/* Large Screen Layout */}
        <nav className="lg:flex hidden max-w-7xl mx-auto items-center justify-between rounded-full bg-[#1a1a1a] outline outline-white/10 outline-offset-[-1px] px-4 py-2 pointer-events-auto">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src="/main-logo.png"
                alt="The Kunal Kamra Show"
                className="h-10 w-10 rounded-full"
              />
            </Link>

            {/* Search box */}
            <div className="w-72 ml-6">
              <div className="relative overflow-hidden">
                <Input
                  type="search"
                  placeholder="Search..."
                  className="bg-[#222222] border-none rounded-full pl-10 py-1.5 h-9 text-neutral-300 focus:outline-none"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Right side - Navigation & Login/Profile */}
          <div className="flex items-center">
            {/* Navigation Links */}
            <div className="flex pr-4 items-center space-x-10 ">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  to={link.href}
                  className={cn(
                    "text-sm text-neutral-300 hover:text-white transition-colors whitespace-nowrap",
                    link.title === "Home" && "text-[#f0ea00] font-medium"
                  )}
                >
                  {link.title}
                </Link>
              ))}
            </div>

            {/* Login Button */}
            {!isAuthenticated ? (
              <Button
                className="bg-[#f2f900] cursor-pointer hover:bg-[#e0da00] leading-tight text-black font-medium px-6 py-2 h-9 rounded-2xl"
                onClick={handleLoginClick}
              >
                Login
              </Button>
            ) : (
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  className="flex items-center justify-center rounded-full bg-[#f0ea00] text-black w-10 h-10 p-0"
                  onClick={handleProfileClick}
                >
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User size={20} />
                  )}
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
        </nav>

        {/* Medium & Small Screen Layout */}
        <nav className="lg:hidden flex max-w-7xl mx-auto items-center justify-between rounded-full bg-[#1a1a1a] outline outline-white/10 outline-offset-[-1px] px-4 py-2 pointer-events-auto">
          {/* Left - Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/main-logo.png"
              alt="The Kunal Kamra Show"
              className="h-10 w-10 rounded-full"
            />
          </Link>

          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search..."
                className="bg-[#222222] border-none rounded-full pl-10 py-1.5 h-9 text-neutral-300 focus:outline-none"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            </div>
          </div>

          {/* Right - Login/Profile and Menu */}
          <div className="flex items-center space-x-3">
            {!isAuthenticated ? (
              <Button
                className="bg-[#f2f900] hover:bg-[#e0da00] leading-tight text-black font-medium px-6 py-2 h-9 rounded-2xl"
                onClick={handleLoginClick}
              >
                Login
              </Button>
            ) : (
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  className="flex items-center justify-center rounded-full bg-[#f0ea00] text-black w-10 h-10 p-0"
                  onClick={handleProfileClick}
                >
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User size={20} />
                  )}
                </Button>
              </div>
            )}

            {/* Hamburger Menu */}
            <Button
              variant="ghost"
              className="p-1 text-white"
              onClick={toggleMenu}
            >
              <Menu size={24} />
            </Button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-[#171717] border-b border-neutral-800 z-50 pointer-events-auto">
            <div className="container mx-auto p-4">
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.title}
                    to={link.href}
                    className={cn(
                      "py-2 text-neutral-300 hover:text-white border-b border-neutral-700 last:border-0",
                      link.title === "Home" && "text-[#f0ea00]"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.title}
                  </Link>
                ))}

                {/* User Account Links - Only show if authenticated */}
                {isAuthenticated && (
                  <div className="pt-2 space-y-2">
                    <Link
                      to="/profile"
                      className="py-2 text-neutral-300 hover:text-white border-b border-neutral-700 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/bookings"
                      className="py-2 text-neutral-300 hover:text-white border-b border-neutral-700 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar size={16} />
                      <span>My Bookings</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="py-2 text-neutral-300 hover:text-white border-b border-neutral-700 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                    <button
                      className="py-2 text-red-400 hover:text-red-300 w-full text-left flex items-center gap-2 border-b border-neutral-700"
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
          </div>
        )}
      </div>

      <SimpleAuthModal isOpen={isAuthModalOpen} onClose={handleCloseModal} />
    </>
  );
}
