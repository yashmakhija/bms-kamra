import { useState, useCallback, useEffect, useRef } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  Menu,
  Search,
  X,
  User,
  LogOut,
  Settings,
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [_, setIsSearchActive] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Get authentication state from store
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLoginClick = useCallback(() => {
    window.location.href = "/auth/login";
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
    setIsSearchActive(false);
    setIsProfileOpen(false);
  }, []);

  const toggleProfile = useCallback(() => {
    setIsProfileOpen((prev) => !prev);
    setIsMenuOpen(false);
    setIsSearchActive(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchActive((prev) => !prev);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setIsProfileOpen(false);
  }, [logout]);

  // Close menu dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button')?.onclick?.toString().includes('toggleMenu')
      ) {
        setIsMenuOpen(false);
      }

      if (
        profileRef.current && 
        !profileRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button')?.onclick?.toString().includes('toggleProfile')
      ) {
        setIsProfileOpen(false);
      }
    }

    if (isMenuOpen || isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMenuOpen, isProfileOpen]);

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
                    link.href === location.pathname && "text-[#f0ea00] font-medium"
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
                onClick={() => {
                  window.location.href = "/auth/login";
                }}
              >
                Login
              </Button>
            ) : (
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  className="flex cursor-pointer items-center justify-center rounded-full bg-[#f0ea00] text-black w-10 h-10 p-0"
                  onClick={toggleProfile}
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
                  <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-3xl z-50 overflow-hidden shadow-lg">
                    <div className="p-4 pb-2 border-b border-white/10">
                      <p className="text-white font-medium">{user?.name || "User"}</p>
                      <p className="text-neutral-400 text-sm truncate">{user?.email || ""}</p>
                    </div>
                    <div className="py-2 px-2">
                      <Link
                        to="/profile"
                        className="py-3 px-6 text-base text-neutral-300 hover:text-white hover:bg-[#222222] rounded-xl flex items-center gap-3 block w-full text-left mb-1"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User size={18} />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="py-3 px-6 text-base text-neutral-300 hover:text-white hover:bg-[#222222] rounded-xl flex items-center gap-3 block w-full text-left mb-1"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings size={18} />
                        Settings
                      </Link>
                      <button
                        className="py-3 px-6 text-base text-red-400 hover:text-red-300 hover:bg-[#222222] rounded-xl flex items-center gap-3 w-full text-left"
                        onClick={handleLogout}
                      >
                        <LogOut size={18} />
                        Logout
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
                className="bg-[#f2f900] hover:bg-[#e0da00] leading-tight text-black font-medium rounded-full w-10 h-10 p-0 flex items-center justify-center"
                onClick={handleLoginClick}
              >
                <User size={20} />
              </Button>
            ) : (
              <div className="relative" ref={profileRef}>
                <Button
                  variant="ghost"
                  className="flex cursor-pointer items-center justify-center rounded-full bg-[#f0ea00] text-black w-10 h-10 p-0"
                  onClick={toggleProfile}
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

                {/* Mobile Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-3xl z-50 overflow-hidden shadow-lg">
                    <div className="py-2 px-2">
                      <Link
                        to="/profile"
                        className="py-3 px-6 text-base text-neutral-300 hover:text-white hover:bg-[#222222] rounded-xl flex items-center gap-3 block w-full text-left mb-1"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User size={18} />
                        Profile
                      </Link>
                      <button
                        className="py-3 px-6 text-base text-red-400 hover:text-red-300 hover:bg-[#222222] rounded-xl flex items-center gap-3 w-full text-left"
                        onClick={handleLogout}
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger Menu */}
            <Button
              variant="ghost"
              className={cn(
                "p-0 flex items-center justify-center w-10 h-10 rounded-2xl",
                isMenuOpen ? "bg-neutral-800" : "text-white"
              )}
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={20} className="text-white " /> : <Menu size={20} />}
            </Button>
          </div>
        </nav>

        {/* Mobile & Medium Menu Dropdown */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="absolute top-24 right-4 w-56 bg-[#1a1a1a] border border-white/10 rounded-3xl z-50 pointer-events-auto shadow-lg md:right-4 lg:hidden overflow-hidden"
          >
            <div className="py-2 px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  to={link.href}
                  className={cn(
                    "py-3 px-6 text-base text-neutral-300 hover:text-white hover:bg-[#222222] rounded-xl flex items-center block w-full text-left mb-1",
                    link.href === location.pathname && "text-[#f0ea00] font-medium"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <SimpleAuthModal isOpen={isAuthModalOpen} onClose={handleCloseModal} />
    </>
  );
}
