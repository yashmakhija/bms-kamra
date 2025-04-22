import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import { Link } from "react-router-dom";
import { apiClient } from "@repo/api-client";
import { Loader2, UserCircle, LogOut } from "lucide-react";

export function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        try {
          setIsLoading(true);
          // Refresh user data to ensure we have the latest information
          await apiClient.getCurrentUser();
        } catch (error) {
          console.error("Error fetching user details:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserDetails();
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0f0f0f]">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
        <p className="text-lg text-white">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-b from-[#1e1e1e] to-[#171717] rounded-3xl p-8 shadow-xl border border-neutral-800/50">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex-shrink-0">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="h-32 w-32 rounded-full object-cover border-4 border-red-600"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-neutral-800 flex items-center justify-center border-4 border-red-600">
                  <UserCircle size={80} className="text-neutral-400" />
                </div>
              )}
            </div>

            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user?.name || "User"}
              </h1>
              <p className="text-gray-400 mb-4">{user?.email}</p>
              <p className="text-gray-400 mb-6">
                {user?.phone ? `Phone: ${user.phone}` : "No phone number added"}
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button className="bg-neutral-800 hover:bg-neutral-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-neutral-800 pt-8">
            <h2 className="text-2xl font-bold text-white mb-6">My Bookings</h2>
            <div className="bg-neutral-800/50 rounded-xl p-6 text-center">
              <p className="text-gray-400">You don't have any bookings yet.</p>
              <Link
                to="/"
                className="text-red-500 hover:text-red-400 mt-2 inline-block font-medium"
              >
                Browse shows
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
