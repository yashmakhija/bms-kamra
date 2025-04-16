import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth";
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { CircleUser, Settings, LogOut, Ticket } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";

interface UserButtonProps {
  onLoginClick: () => void;
}

export function UserButton({ onLoginClick }: UserButtonProps) {
  const { user, isAuthenticated, logout, refreshUser } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Refresh user data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
    }
  }, [isAuthenticated, refreshUser]);

  const handleLoginClick = (e: React.MouseEvent) => {
    console.log("Login button clicked in UserButton component");
    e.preventDefault();
    e.stopPropagation();
    onLoginClick();
  };

  if (!isAuthenticated || !user) {
    return (
      <Button
        onClick={handleLoginClick}
        className="!bg-[#e31001] rounded-2xl text-white hover:!bg-[#e31001]/90 px-4 py-2 sm:px-4 sm:py-3"
      >
        <span className="flex items-center gap-2">
          <CircleUser className="h-5 w-5" />
          <span className="hidden md:inline">Login</span>
        </span>
      </Button>
    );
  }

  // For authenticated users, show profile button
  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name || "User"}
            />
            <AvatarFallback className="bg-[#e31001] text-white">
              {user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)
                : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-0.5 leading-none">
            <p className="font-medium text-sm">{user.name}</p>
            <p className="w-[200px] truncate text-xs text-gray-500">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/my-tickets"
            className="cursor-pointer flex items-center"
            onClick={() => setIsDropdownOpen(false)}
          >
            <Ticket className="mr-2 h-4 w-4" />
            <span>My Tickets</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/profile"
            className="cursor-pointer flex items-center"
            onClick={() => setIsDropdownOpen(false)}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600 flex items-center"
          onClick={() => {
            logout();
            setIsDropdownOpen(false);
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
