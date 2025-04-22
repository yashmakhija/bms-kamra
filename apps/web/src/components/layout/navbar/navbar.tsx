import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import { Menu, Search, X } from "lucide-react";
import { SimpleAuthModal } from "../../auth/simple-auth-modal";
import { Input } from "@repo/ui/components/ui/input";
import { cn } from "@repo/ui/utils";

// Define navigation links
const navLinks = [
  { title: "Home", href: "/" },
  { title: "Tickets", href: "/tickets" },
  { title: "Gallery", href: "/gallery" },
  { title: "Episodes", href: "/episodes" },
  { title: "Podcasts", href: "/podcasts" },
  { title: "Merch", href: "/merch" },
];

export function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

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
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchActive((prev) => !prev);
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      <nav className="h-16 top-0 flex items-center px-4 fixed w-full z-10 bg-[#171717] overflow-hidden">
        <div className="container mx-10 flex justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="The Kunal Kamra Show"
                className="h-12 w-12"
              />
            </Link>
            <div className="hidden md:flex space-x-8">
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

          {/* Desktop Navigation */}

          {/* Search and Login (Desktop) */}
          <div className="hidden md:flex items-center -mx-[200px] space-x-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search"
                className="w-80 bg-neutral-800 border-neutral-700 rounded-xl outline outline-neutral-600 inline-flex justify-start items-center gap-3 pl-10 py-1.5 h-10 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-50 h-4 w-4" />
            </div>
            <Button
              className="bg-[#e31001] hover:bg-[#c50e00] text-white px-6 py-2 h-10 rounded-md"
              onClick={handleLoginClick}
            >
              Login
            </Button>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleSearch}
              className="p-2 text-neutral-300 hover:text-white"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={toggleMenu}
              className="p-2 text-neutral-300 hover:text-white"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchActive && (
          <div className="absolute top-16 left-0 right-0 bg-[#171717] p-4 border-b border-neutral-800 md:hidden">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search"
                autoFocus
                className="w-full bg-neutral-800 border-neutral-700 rounded-full pl-10 py-1.5 h-10 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-[#171717] border-b border-neutral-800 md:hidden">
            <div className="flex flex-col p-4">
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
              <div className="py-4">
                <Button
                  className="w-full bg-[#e31001] rounded-xl hover:bg-[#c50e00] text-white py-2 "
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLoginClick();
                  }}
                >
                  Login
                </Button>
              </div>
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
