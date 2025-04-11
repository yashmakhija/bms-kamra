import { Button } from "@repo/ui/button";
import { Link } from "react-router-dom";
import { CircleUser } from "lucide-react";

export function Navbar() {
  return (
    <nav className=" h-16 flex items-center px-4 fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="The Kunal Kamra App"
            className="h-12 w-12"
          />
        </Link>

        <div className="flex items-center">
          <Button
            className="!bg-[#e31001] rounded-full text-white hover:!bg-[#e31001]/90 px-4 py-2"
            appName="kunal-bms"
          >
            <span className="flex items-center gap-2">
              <CircleUser className="h-5 w-5" />
              Login
            </span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
