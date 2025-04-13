import { Button } from "@repo/ui/button";
import { Link } from "react-router-dom";
import { CircleUser, Menu } from "lucide-react";

export function Navbar() {
  return (
    <nav className="h-16 flex items-center px-4 fixed w-full top-0 z-50 bg-[#171717]/80 backdrop-blur-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="md:hidden">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 p-2"
            appName="kunal-bms"
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

        <Button
          className="!bg-[#e31001] rounded-2xl text-white hover:!bg-[#e31001]/90 px-4 py-2 sm:px-4 sm:py-3"
          appName="kunal-bms"
        >
          <span className="flex items-center gap-2">
            <CircleUser className="h-5 w-5" />
            <span className="hidden md:inline">Login</span>
          </span>
        </Button>
      </div>
    </nav>
  );
}
