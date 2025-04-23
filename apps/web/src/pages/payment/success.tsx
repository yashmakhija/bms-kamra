import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  Calendar,
  Clock,
  Timer,
  MapPin,
  HomeIcon,
  BadgeCheck,
  Printer,
} from "lucide-react";
import { useBookingStore } from "../../store/bookings";
import { useEffect, useState } from "react";
import { Ticket } from "@repo/api-client";
import { apiClient } from "@repo/api-client";
import { cn } from "@repo/ui/utils";
import { UpcomingShows } from "../../components/home/upcoming-shows";

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

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { currentBooking, getBookingById, bookingError } = useBookingStore();
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      setIsLoading(true);
      setError(null);

      try {
        // If we have a booking ID in params but no current booking, fetch it
        if (bookingId) {
          await getBookingById(bookingId);
        } else {
          // Try to get the booking ID from localStorage if not in URL or store
          const storedBookingId = localStorage.getItem("current_booking_id");
          if (storedBookingId) {
            await getBookingById(storedBookingId);
          } else {
            setError("No booking ID found. Please check your booking history.");
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch booking details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [bookingId, getBookingById, retryCount]);

  // Update error state from store error
  useEffect(() => {
    if (bookingError) {
      setError(bookingError);
    }
  }, [bookingError]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleLogin = () => {
    // Clear any existing authentication data
    apiClient.logout();
    // Redirect to login page
    navigate("/login", {
      state: {
        returnTo: `/payment/success/${bookingId || localStorage.getItem("current_booking_id") || ""}`,
      },
    });
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "26 Jan 2026";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return "8:00 PM";

    const time = new Date(timeString);
    return time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if we have the necessary booking data
  const hasBookingData =
    currentBooking &&
    currentBooking.tickets &&
    currentBooking.tickets.length > 0;

  // Cast tickets to extended type
  const tickets =
    (currentBooking?.tickets as unknown as ExtendedTicket[]) || [];
  const firstTicket = tickets.length > 0 ? tickets[0] : undefined;

  // Extract show data from the booking based on the provided JSON structure
  const getShowTitle = () => {
    if (!hasBookingData || !firstTicket)
      return "Desh Ke Buddhe | Stand-Up Comedy by Kunal Kamra";

    try {
      return (
        firstTicket.section?.showtime?.event?.show?.title ||
        "Desh Ke Buddhe | Stand-Up Comedy by Kunal Kamra"
      );
    } catch {
      return "Desh Ke Buddhe | Stand-Up Comedy by Kunal Kamra";
    }
  };

  const getShowDate = () => {
    if (!hasBookingData || !firstTicket) return "26 Jan 2026";

    try {
      return (
        formatDate(firstTicket.section?.showtime?.event?.date) || "26 Jan 2026"
      );
    } catch {
      return "26 Jan 2026";
    }
  };

  const getShowTime = () => {
    if (!hasBookingData || !firstTicket) return "8:00 PM";

    try {
      return formatTime(firstTicket.section?.showtime?.startTime) || "8:00 PM";
    } catch {
      return "8:00 PM";
    }
  };

  const getVenue = () => {
    if (!hasBookingData || !firstTicket) return "Emirates Theatre, Dubai";

    try {
      const venue = firstTicket.section?.showtime?.event?.show?.venue;
      return venue
        ? `${venue.name || ""}, ${venue.city || ""}`.trim() ||
            "Emirates Theatre, Dubai"
        : "Emirates Theatre, Dubai";
    } catch {
      return "Emirates Theatre, Dubai";
    }
  };

  // Get the show ID from the current booking
  const getBookedShowId = () => {
    if (
      !currentBooking ||
      !currentBooking.tickets ||
      currentBooking.tickets.length === 0
    ) {
      return undefined;
    }

    try {
      // Extract show ID from the first ticket's section > showtime > event > show > id
      const firstTicket = currentBooking
        .tickets[0] as unknown as ExtendedTicket;
      return firstTicket.section?.showtime?.event?.show?.id;
    } catch (error) {
      console.error("Error extracting show ID:", error);
      return undefined;
    }
  };

  // If there's loading or error state, render corresponding UI
  if (isLoading || error) {
    return (
      <section className="w-full py-12 mt-10 bg-neutral-900 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="bg-neutral-800 rounded-3xl shadow-xl overflow-hidden max-w-5xl mx-auto">
            <div className="p-12 flex flex-col items-center justify-center">
              {isLoading ? (
                <p className="text-neutral-400 text-center">
                  Loading booking details...
                </p>
              ) : (
                <div className="text-center">
                  <p className="text-amber-500 mb-4">
                    Unable to load booking details
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      className="border-neutral-700 text-white hover:bg-neutral-700"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={handleLogin}
                      className="bg-white text-black hover:bg-neutral-200"
                    >
                      Login Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen py-12 mt-10 bg-neutral-900">
      <div className="container mx-auto px-4 py-12">
        <div className="md:bg-neutral-800 rounded-3xl shadow-xl overflow-hidden max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row relative">
            {/* Left side - Booking confirmation - visible on desktop */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center">
                  <BadgeCheck
                    className="w-14 h-14 text-[#AEE301] mb-5"
                    size={24}
                  />
                </div>

                <h2 className="text-3xl text-neutral-50 leading-9 font-bold mb-4">
                  Your booking is confirmed!
                </h2>

                <p className="text-neutral-50 text-sm font-normal leading-none mb-6">
                  Booking ID: {currentBooking?.id?.substring(0, 6) || "XD1234"}
                </p>

                <p className="text-neutral-300 text-sm font-normal leading-none">
                  You will receive an email with confirmation.
                </p>
              </div>
            </div>

            {/* Vertical divider with edge circles - only visible on desktop */}
            <div className="hidden  absolute left-1/2 top-0 bottom-0 -translate-x-1/2 h-full md:flex items-center">
              <div className="relative h-full flex flex-col items-center justify-center">
                {/* Top edge circle */}
                <div className="absolute -top-1 w-4 h-4 bg-neutral-900 border border-neutral-700 rounded-full z-10"></div>

                {/* Vertical dotted line */}
                <div className="h-full flex flex-col items-center justify-evenly py-8">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-[4px] h-[15px] bg-neutral-900" />
                  ))}
                </div>

                {/* Bottom edge circle */}
                <div className="absolute -bottom-1 w-4 h-4 bg-neutral-900 border border-neutral-700 rounded-full z-10"></div>
              </div>
            </div>

            {/* Mobile show info card with horizontal separator - only visible on mobile */}
            <div className="block md:hidden mx-4 mt-4 mb-8">
              <div className="bg-neutral-800 rounded-xl p-6">
                <h3 className="text-xl text-white font-bold mb-6">
                  {getShowTitle()}
                </h3>

                <div className="space-y-5">
                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <div className="text-[#AEE301] mt-0.5">
                      <Calendar size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-xs">Date</p>
                      <p className="text-white text-sm mt-0.5">
                        {getShowDate()}
                      </p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-start gap-3">
                    <div className="text-[#AEE301] mt-0.5">
                      <Timer size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-xs">Duration</p>
                      <p className="text-white text-sm mt-0.5">90 mins</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3">
                    <div className="text-[#AEE301] mt-0.5">
                      <Clock size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-xs">Time</p>
                      <p className="text-white text-sm mt-0.5">
                        {getShowTime()}
                      </p>
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="flex items-start gap-3">
                    <div className="text-[#AEE301] mt-0.5">
                      <MapPin size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-xs">Venue</p>
                      <p className="text-white text-sm mt-0.5">{getVenue()}</p>
                    </div>
                  </div>
                </div>

                {/* Horizontal separator with dots */}
                <div className="my-6 relative flex items-center">
                  {/* Left edge circle */}
                  <div className="absolute -left-8 w-4 h-4 bg-neutral-900   rounded-full z-10"></div>

                  {/* Horizontal dotted line */}
                  <div className="w-full flex justify-evenly gap-4 items-center px-4">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[4px] w-[22px] bg-neutral-900"
                      />
                    ))}
                  </div>

                  {/* Right edge circle */}
                  <div className="absolute -right-8 w-4 h-4 bg-neutral-900    rounded-full z-10"></div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-neutral-400 text-sm font-normal leading-none">
                      No. of Ticket(s)
                    </p>
                    <p className="text-white text-2xl font-bold leading-normal">
                      {currentBooking?.tickets?.length || 2}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-neutral-400 text-sm mb-1">
                      Total Amount
                    </p>
                    <p className="text-white text-2xl font-bold">
                      ₹
                      {currentBooking?.totalAmount?.toLocaleString() || "3,998"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Show details - only visible on desktop */}
            <div className="hidden md:block md:w-1/2 p-8 md:p-12">
              <h3 className="text-2xl text-white font-bold mb-6">
                {getShowTitle()}
              </h3>

              <div className="space-y-5">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="text-[#AEE301] mt-0.5">
                    <Calendar size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs">Date</p>
                    <p className="text-white text-sm mt-0.5">{getShowDate()}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-start gap-3">
                  <div className="text-[#AEE301] mt-0.5">
                    <Timer size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs">Duration</p>
                    <p className="text-white text-sm mt-0.5">90 mins</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                  <div className="text-[#AEE301] mt-0.5">
                    <Clock size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs">Time</p>
                    <p className="text-white text-sm mt-0.5">{getShowTime()}</p>
                  </div>
                </div>

                {/* Venue */}
                <div className="flex items-start gap-3">
                  <div className="text-[#AEE301] mt-0.5">
                    <MapPin size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs">Venue</p>
                    <p className="text-white text-sm mt-0.5">{getVenue()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-700 flex flex-col md:flex-row justify-between items-start md:items-end">
                <div className="mt-5">
                  <p className="text-neutral-400 text-sm font-normal leading-none ">
                    No. of Ticket(s)
                  </p>
                  <p className="text-white text-2xl font-bold leading-normal">
                    {currentBooking?.tickets?.length || 2}
                  </p>
                </div>

                <div className="mt-4 md:mt-0 md:text-right">
                  <p className="text-neutral-400 text-sm mb-1">Total Amount</p>
                  <p className="text-white text-2xl font-bold">
                    ₹{currentBooking?.totalAmount?.toLocaleString() || "3,998"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Ticket Button */}
      {currentBooking && currentBooking.status === "PAID" && (
        <div className="flex justify-center mt-8 mb-12">
          <Button
            className="bg-[#AEE301] cursor-pointer hover:bg-[#9CCB01] text-black font-medium text-base px-8 py-6 rounded-xl flex items-center gap-2"
            onClick={() => {
              // Use the same mechanism as profile page for consistency
              localStorage.setItem("loading_ticket_id", currentBooking.id);
              navigate(`/ticket/view/${currentBooking.id}`);
            }}
          >
            <Printer size={20} className="mr-1" />
            View My Ticket
          </Button>
        </div>
      )}

      <UpcomingShows
        limit={3}
        title="Recommended"
        removeButton={true}
        excludeShowId={getBookedShowId()}
        removeArrow={true}
      />
    </section>
  );
}

export default PaymentSuccessPage;
