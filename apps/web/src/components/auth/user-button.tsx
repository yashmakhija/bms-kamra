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
import {
  CircleUser,
  Settings,
  LogOut,
  Ticket,
  ChevronDown,
} from "lucide-react";
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

  // Get initial letters for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!isAuthenticated || !user) {
    return (
      <Button
        onClick={handleLoginClick}
        className="!bg-[#e31001] hover:!bg-[#c01001] rounded-xl text-white px-4 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <span className="flex items-center gap-2">
          <CircleUser className="h-5 w-5" />
          <span className="hidden md:inline font-medium">Sign in</span>
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 rounded-xl pl-2 pr-1 hover:bg-white/10 focus:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-white/30 transition-all">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || "User"}
              />
              <AvatarFallback className="bg-gradient-to-br from-[#e31001] to-[#ff4d38] text-white font-medium text-sm">
                {user.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate text-white">
              {user.name?.split(" ")[0] || "User"}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-white/80 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 p-2 rounded-xl shadow-xl bg-[#1A1A1A] border border-[#333333] animate-in fade-in-70 zoom-in-95 slide-in-from-top-2"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col gap-2 p-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-[#e31001]/30">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || "User"}
              />
              <AvatarFallback className="bg-gradient-to-br from-[#e31001] to-[#ff4d38] text-white">
                {user.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="font-semibold text-sm text-white">{user.name}</p>
              <p className="w-[180px] truncate text-xs text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 bg-gray-700/50" />

        <div className="px-1 py-1">
          <DropdownMenuItem asChild>
            <Link
              to="/my-tickets"
              className="cursor-pointer flex items-center rounded-lg p-2 text-gray-200 hover:bg-white/10 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Ticket className="mr-2 h-5 w-5 text-gray-400" />
              <span className="text-sm">My Tickets</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              to="/profile"
              className="cursor-pointer flex items-center rounded-lg p-2 text-gray-200 hover:bg-white/10 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Settings className="mr-2 h-5 w-5 text-gray-400" />
              <span className="text-sm">Account Settings</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1 bg-gray-700/50" />

        <div className="px-1 py-1">
          <DropdownMenuItem
            className="cursor-pointer rounded-lg p-2 text-[#ff4d38] hover:bg-[#2A1A1A] transition-colors flex items-center"
            onClick={() => {
              logout();
              setIsDropdownOpen(false);
            }}
          >
            <LogOut className="mr-2 h-5 w-5" />
            <span className="text-sm font-medium">Log out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
