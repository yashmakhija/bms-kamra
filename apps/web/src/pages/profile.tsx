import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, Booking, Ticket } from "@repo/api-client";
import {
  Loader2,
  UserCircle,
  LogOut,
  Calendar,
  Clock,
  MapPin,
  ArrowUpRight,
  Ticket as TicketIcon,
  Printer,
  ChevronRight,
} from "lucide-react";
import { useBookingStore } from "../store/bookings";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { useShowsStore } from "../store/shows";

// Extended ticket type to support show details that might be added by the API
interface ExtendedTicket extends Ticket {
  section?: {
    showtime?: {
      startTime?: string;
      event?: {
        date?: string;
        show?: {
          id?: string;
          title?: string;
          venue?: {
            name?: string;
            city?: string;
          };
        };
      };
    };
    name?: string;
  };
}

export function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const {
    userBookings,
    isLoadingUserBookings,
    userBookingsError,
    getUserBookings,
    getBookingById,
    currentBooking,
    viewedBookings,
  } = useBookingStore();
  const { getShowById, shows } = useShowsStore();
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    null
  );
  const [loadingBookingIds, setLoadingBookingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          // Refresh user data to ensure we have the latest information
          await apiClient.getCurrentUser();

          // Fetch user bookings
          await getUserBookings();
        } catch (error) {
          console.error("Error fetching user details:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user, getUserBookings]);

  const handleLogout = () => {
    logout();
  };

  const handleViewTicket = async (bookingId: string) => {
    try {
      // Set loading state for this specific booking
      setLoadingBookingIds((prev) => [...prev, bookingId]);

      // Explicitly store that we're opening this ticket to show loading state in view page
      localStorage.setItem("loading_ticket_id", bookingId);

      // Fetch booking details if not already loaded
      await getBookingById(bookingId);

      // Get show details for the booking if needed
      const booking = await apiClient.getBookingById(bookingId);
      const firstTicket = booking.tickets[0] as ExtendedTicket;
      const showId = firstTicket?.section?.showtime?.event?.show?.id;

      if (showId && !shows.find((s) => s.id === showId)) {
        await getShowById(showId);
      }

      // Navigate to ticket view after preloading data
      navigate(`/ticket/view/${bookingId}`);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      setError(
        `Failed to load ticket: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoadingBookingIds((prev) => prev.filter((id) => id !== bookingId));
      localStorage.removeItem("loading_ticket_id");
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return "N/A";

    const time = new Date(timeString);
    return time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper to get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "bg-green-900/30 text-green-400 border border-green-600/30 hover:bg-green-800/30";
      case "PENDING":
        return "bg-amber-900/30 text-amber-400 border border-amber-600/30 hover:bg-amber-800/30";
      case "CANCELED":
      case "EXPIRED":
        return "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700";
      default:
        return "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700";
    }
  };

  // Helper to toggle expanded booking
  const toggleExpandBooking = (bookingId: string) => {
    setExpandedBookingId((prevId) => (prevId === bookingId ? null : bookingId));
  };

  // Helper to check if a booking is currently loading
  const isBookingLoading = (bookingId: string) => {
    return loadingBookingIds.includes(bookingId);
  };

  if (isLoading || isLoadingUserBookings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0f0f0f]">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
        <p className="text-lg text-white">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
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

            {userBookingsError && (
              <div className="bg-red-900/30 border border-red-800/30 rounded-xl p-6 mb-6">
                <p className="text-red-400 text-center">{userBookingsError}</p>
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => getUserBookings()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {!userBookingsError && userBookings.length === 0 ? (
              <div className="bg-neutral-800/50 rounded-xl p-8 text-center">
                <TicketIcon
                  size={48}
                  className="text-neutral-700 mx-auto mb-4"
                />
                <p className="text-gray-400 text-lg mb-3">
                  You don't have any bookings yet.
                </p>
                <Link
                  to="/"
                  className="text-red-500 hover:text-red-400 mt-2 inline-block font-medium"
                >
                  Browse shows
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userBookings.map((booking) => {
                  // Cast first ticket to extended type with show details
                  const firstTicket = booking.tickets[0] as ExtendedTicket;

                  // Default values
                  let showTitle = "Show Title";
                  let showDate: string | Date | undefined = undefined;
                  let showTime: string | undefined = undefined;
                  let showVenue = "Venue";
                  let showLocation = "Location";

                  // Try to extract show details if available
                  try {
                    showTitle =
                      firstTicket?.section?.showtime?.event?.show?.title ||
                      "Show Title";
                    showDate = firstTicket?.section?.showtime?.event?.date;
                    showTime = firstTicket?.section?.showtime?.startTime;
                    showVenue =
                      firstTicket?.section?.showtime?.event?.show?.venue
                        ?.name || "Venue";
                    showLocation =
                      firstTicket?.section?.showtime?.event?.show?.venue
                        ?.city || "Location";
                  } catch (e) {
                    console.error("Error parsing show details", e);
                  }

                  const isExpanded = expandedBookingId === booking.id;
                  const isLoading = isBookingLoading(booking.id);

                  return (
                    <div
                      key={booking.id}
                      className={`bg-neutral-800/50 border border-neutral-700/50 rounded-xl overflow-hidden transition-all duration-300 ${
                        isExpanded ? "shadow-lg" : ""
                      }`}
                    >
                      <div
                        className="p-6 cursor-pointer hover:bg-neutral-800/80 transition-colors"
                        onClick={() => toggleExpandBooking(booking.id)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-white">
                                {showTitle}
                              </h3>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>
                            <p className="text-neutral-400 text-sm mt-1">
                              Booking ID:{" "}
                              {booking.id.substring(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold text-white">
                              {booking.currency === "INR"
                                ? "₹"
                                : booking.currency}{" "}
                              {booking.totalAmount.toLocaleString()}
                            </p>
                            <ChevronRight
                              size={20}
                              className={`text-neutral-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-[#AEE301]" />
                            <div>
                              <p className="text-xs text-neutral-500">Date</p>
                              <p className="text-sm text-white">
                                {formatDate(showDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-[#AEE301]" />
                            <div>
                              <p className="text-xs text-neutral-500">Time</p>
                              <p className="text-sm text-white">
                                {formatTime(showTime)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-[#AEE301]" />
                            <div>
                              <p className="text-xs text-neutral-500">Venue</p>
                              <p className="text-sm text-white">{showVenue}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 bg-neutral-800/80 border-t border-neutral-700/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">
                                Section
                              </p>
                              <p className="text-sm text-white">
                                {firstTicket?.section?.name || "Standard"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">
                                Location
                              </p>
                              <p className="text-sm text-white">
                                {showLocation}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">
                                Tickets
                              </p>
                              <p className="text-sm text-white">
                                {booking.tickets.length}{" "}
                                {booking.tickets.length === 1
                                  ? "ticket"
                                  : "tickets"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">
                                Booked On
                              </p>
                              <p className="text-sm text-white">
                                {formatDate(booking.createdAt)}
                              </p>
                            </div>
                          </div>

                          <Button
                            className="w-full sm:w-auto bg-[#AEE301] hover:bg-[#9CCB01] text-black font-medium"
                            onClick={() => handleViewTicket(booking.id)}
                            disabled={booking.status !== "PAID" || isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2
                                  size={16}
                                  className="mr-2 animate-spin"
                                />
                                Loading Ticket...
                              </>
                            ) : (
                              <>
                                <Printer size={16} className="mr-2" />
                                View E-Ticket
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
