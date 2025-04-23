"use client";

import { useRef, useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Ticket as TicketIcon,
  MapPin,
  AlertCircle,
  Loader2,
  Printer,
} from "lucide-react";
import { cn } from "@repo/ui/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";

import { useBookingStore } from "../../store/bookings";
import { Booking, Ticket } from "@repo/api-client";

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

// Reusable Components
interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 mb-0">
      <div className="text-[#AEE301] mt-0.5">{icon}</div>
      <div>
        <p className="text-neutral-400 text-[10px] font-normal leading-3">
          {label}
        </p>
        <p className="text-neutral-100 text-sm font-normal leading-tight mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  isLoading?: boolean;
  onViewTicket: (bookingId: string) => void;
}

function BookingCard({ booking, isLoading, onViewTicket }: BookingCardProps) {
  const handleViewTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewTicket(booking.id);
  };

  // Cast first ticket to extended type with show details
  const firstTicket = booking.tickets[0] as ExtendedTicket;

  // Default values
  let showTitle = "Show Title";
  let showDate = "Unknown Date";
  let showTime = "Unknown Time";
  let showVenue = "Unknown Venue";
  let duration = "90 mins";

  // Try to extract show details if available
  try {
    showTitle =
      firstTicket?.section?.showtime?.event?.show?.title || "Show Title";

    // Format date
    if (firstTicket?.section?.showtime?.event?.date) {
      const date = new Date(firstTicket.section.showtime.event.date);
      showDate = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    // Format time
    if (firstTicket?.section?.showtime?.startTime) {
      const time = new Date(firstTicket.section.showtime.startTime);
      showTime = time.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    // Get venue
    showVenue = firstTicket?.section?.showtime?.event?.show?.venue
      ? `${firstTicket.section.showtime.event.show.venue.name}${
          firstTicket.section.showtime.event.show.venue.city
            ? `, ${firstTicket.section.showtime.event.show.venue.city}`
            : ""
        }`
      : "Unknown Venue";
  } catch (e) {
    console.error("Error parsing show details", e);
  }

  return (
    <div className="bg-neutral-800 rounded-[20px] p-6 text-white w-90 h-105 aspect-[1/1.4] flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg text-white font-bold line-clamp-3 leading-tight">
          {showTitle}
        </h2>
      </div>

      <p className="text-neutral-400 text-xs mb-5">
        Booking ID: {booking.id.substring(0, 8).toUpperCase()}
      </p>

      <div className="grid grid-cols-1 gap-y-5 flex-grow">
        <InfoItem
          icon={<Calendar size={20} strokeWidth={1.5} />}
          label="Date"
          value={showDate}
        />
        <InfoItem
          icon={<Clock size={20} strokeWidth={1.5} />}
          label="Time"
          value={showTime}
        />
        <InfoItem
          icon={<MapPin size={20} strokeWidth={1.5} />}
          label="Venue"
          value={showVenue}
        />
        <InfoItem
          icon={<TicketIcon size={20} strokeWidth={1.5} />}
          label="Tickets"
          value={`${booking.tickets.length} ${booking.tickets.length === 1 ? "ticket" : "tickets"}`}
        />
      </div>

      {/* Dotted line separator - fixed position */}
      <div className="h-[30px] mt-5 mb-4 relative">
        <div className="absolute top-1/2 -translate-y-1/2 left-[-24px] right-[-24px] h-1 flex items-center">
          {/* Left Edge Circle */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#171717] rounded-full z-10" />

          {/* Dotted Line */}
          <div className="w-full flex justify-between items-center px-6">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-[2.5px] rounded-full bg-neutral-900",
                  i % 3 === 1 ? "w-4" : "w-2"
                )}
              />
            ))}
          </div>

          {/* Right Edge Circle */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-[#171717] rounded-full z-10" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col"></div>

        <Button
          onClick={handleViewTicket}
          disabled={booking.status !== "PAID" || isLoading}
          className="inline-flex cursor-pointer items-center justify-center bg-[#e31001] hover:bg-[#D00000] text-white text-sm leading-none font-medium rounded-xl gap-2 overflow-hidden min-w-[110px] h-[40px] px-6 py-3"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-1" />
              Loading...
            </>
          ) : (
            <>
              <Printer size={16} className="mr-1" />
              View Ticket
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface MyBookingsProps {
  className?: string;
}

export function TotalBookings({ className }: MyBookingsProps) {
  const navigate = useNavigate();
  const {
    userBookings,
    isLoadingUserBookings,
    userBookingsError,
    getUserBookings,
    getBookingById,
  } = useBookingStore();

  const [loadingBookingIds, setLoadingBookingIds] = useState<string[]>([]);

  // Fetch bookings on component mount
  useEffect(() => {
    getUserBookings();
  }, [getUserBookings]);

  // Handle view ticket with same logic as profile page
  const handleViewTicket = async (bookingId: string) => {
    try {
      // Set loading state for this specific booking
      setLoadingBookingIds((prev) => [...prev, bookingId]);

      // Store in localStorage to indicate we're loading this ticket
      localStorage.setItem("loading_ticket_id", bookingId);

      // Fetch booking details if not already loaded
      await getBookingById(bookingId);

      // Navigate to ticket view
      navigate(`/ticket/view/${bookingId}`);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoadingBookingIds((prev) => prev.filter((id) => id !== bookingId));
      localStorage.removeItem("loading_ticket_id");
    }
  };

  // Helper to check if a booking is currently loading
  const isBookingLoading = (bookingId: string) => {
    return loadingBookingIds.includes(bookingId);
  };

  // Loading state
  if (isLoadingUserBookings && userBookings.length === 0) {
    return (
      <section
        className={cn(
          "w-full h-screen py-24 bg-[#171717] text-center",
          className
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#e31001] animate-spin mb-4" />
            <p className="text-white text-lg">Loading your bookings...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (userBookingsError) {
    return (
      <section
        className={cn("w-full py-24 bg-[#171717] text-center", className)}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 text-[#e31001] mb-4" />
            <p className="text-white text-lg">
              {userBookingsError ||
                "Failed to load your bookings. Please try again later."}
            </p>
            <Button
              onClick={() => getUserBookings()}
              className="mt-4 bg-[#e31001] hover:bg-[#D00000] text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // No bookings state
  if (userBookings.length === 0) {
    return (
      <section
        className={cn(
          "w-full h-screen py-24 bg-[#171717] text-center",
          className
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <TicketIcon className="w-12 h-12 text-neutral-700 mb-4" />
            <h3 className="text-xl text-white font-semibold mb-3">
              You don't have any bookings yet
            </h3>
            <p className="text-neutral-400 mb-6 max-w-md">
              Browse our upcoming shows and book your tickets to see them here.
            </p>
            <Button
              onClick={() => navigate("/tickets")}
              className="bg-[#e31001] hover:bg-[#D00000] text-white"
            >
              Browse Shows
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Filter to only show PAID tickets
  const paidBookings = userBookings.filter(
    (booking) => booking.status === "PAID"
  );

  // No paid bookings state
  if (paidBookings.length === 0) {
    return (
      <section
        className={cn(
          "w-full h-screen py-24 bg-[#171717] text-center",
          className
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <TicketIcon className="w-12 h-12 text-neutral-700 mb-4" />
            <h3 className="text-xl text-white font-semibold mb-3">
              No available tickets found
            </h3>
            <p className="text-neutral-400 mb-6 max-w-md">
              Your bookings might be pending payment or have been cancelled.
            </p>
            <Button
              onClick={() => navigate("/tickets")}
              className="bg-[#e31001] hover:bg-[#D00000] text-white"
            >
              Browse Shows
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full bg-neutral-900", className)}>
      <div className="container mx-auto px-4 md:px-8 lg:px-30">
        <div className="flex justify-center items-center mb-8 mt-10 ">
          <h2 className="text-3xl mt-12 font-bold text-white">Your Bookings</h2>
        </div>

        {/* Mobile, Tablet & Desktop Views: Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 lg:gap-16">
          {paidBookings.map((booking) => (
            <div
              key={booking.id}
              className="w-full max-w-[420px] mx-auto md:max-w-none mb-12"
            >
              <BookingCard
                booking={booking}
                isLoading={isBookingLoading(booking.id)}
                onViewTicket={handleViewTicket}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
