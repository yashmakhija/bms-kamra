import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import { Menu } from "lucide-react";
import { SimpleAuthModal } from "../../auth/simple-auth-modal";
import { UserButton } from "../../auth/user-button";

export function Navbar() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  return (
    <>
      <nav className="h-16 flex items-center px-4 fixed w-full top-0 z-10 bg-[#171717]/80 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="md:hidden">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 p-2"
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

          {/* Navigation links - can be uncommented when needed */}
          {/* <div className="hidden md:flex items-center gap-8">
            <Link to="/shows" className="text-white hover:text-white/80">
              Shows
            </Link>
            <Link to="/videos" className="text-white hover:text-white/80">
              Videos
            </Link>
            <Link to="/about" className="text-white hover:text-white/80">
              About
            </Link>
          </div> */}

          <UserButton onLoginClick={handleLoginClick} />
        </div>
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
