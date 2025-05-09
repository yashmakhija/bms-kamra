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
  Check,
} from "lucide-react";
import { useBookingStore } from "../../../store/bookings";
import { useEffect, useState } from "react";
import { Ticket } from "@repo/api-client";
import { apiClient } from "@repo/api-client";
import { cn } from "@repo/ui/utils";
import { UpcomingShows } from "../../home/upcoming-shows";

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

export function PaymentSuccessHero() {
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
      <section className="w-full py-12 mt-10 bg-[#111111] min-h-screen">
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
    <section className="w-full py-12 bg-gradient-to-b from-[#111111] to-[#1b5100] pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Success Message */}
        <div className="flex flex-col items-center  justify-center mb-16">
          {/* Yellow check icon in dark circle */}
          <div className="w-24 h-24 mt-10 p-6 bg-[#1d1d1d] rounded-[30px] inline-flex justify-start items-center gap-6 overflow-hidden">
            <BadgeCheck
              className="w-12 h-12 absolute  outline-offset-[-2.19px] text-[#F2F900]"
              strokeWidth={2}
            />
          </div>

          <h1 className="text-center justify-center mt-10 text-neutral-50 text-5xl font-bold mb-4">
            Your booking is confirmed!
          </h1>

          <p className="justify-center text-white/80 text-lg font-normal text-center max-w-xl">
            Thank you! A receipt will be sent to your registered email.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button
              className="bg-white text-black cursor-pointer hover:bg-neutral-200 rounded-full px-6 py-5 text-base"
              onClick={() => navigate("/tickets")}
            >
              Browse Merch
            </Button>

            <Button
              className="bg-[#F2F900] text-black cursor-pointer hover:bg-[#F2F900]/90 rounded-full px-6 py-5 text-base"
              onClick={() => {
                // Use the same mechanism as profile page for consistency
                if (currentBooking?.id) {
                  localStorage.setItem("loading_ticket_id", currentBooking.id);
                  navigate(`/ticket/view/${currentBooking.id}`);
                }
              }}
            >
              View Ticket
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PaymentSuccessHero;
