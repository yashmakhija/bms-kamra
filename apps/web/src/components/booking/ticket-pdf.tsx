import React from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  TicketIcon,
  QrCode,
  Info,
} from "lucide-react";
import { useBookingStore } from "../../store/bookings";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import { cn } from "@repo/ui/utils";
import { Ticket } from "@repo/api-client";

// Extended Ticket type with additional properties for the nested structure
interface ExtendedTicket extends Ticket {
  section?: {
    id: string;
    name: string;
    showtime?: {
      id: string;
      startTime: string;
      endTime: string;
      event?: {
        id: string;
        date: string;
        show?: {
          id: string;
          title: string;
          imageUrl: string;
          venue?: {
            id: string;
            name: string;
            address: string;
            city: string;
          };
        };
      };
    };
  };
  _sectionName?: string;
  _showDetails?: {
    title: string;
    date: string;
    startTime: string;
    venue: string;
    location: string;
  };
}

interface TicketPDFProps {
  bookingId?: string;
  className?: string;
  printMode?: boolean;
}

// Helper component for each info item
const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="text-[#AEE301] mt-0.5 flex-shrink-0">{icon}</div>
    <div>
      <p className="text-neutral-400 text-xs font-normal leading-3">{label}</p>
      <p className="text-neutral-100 text-sm font-medium leading-tight mt-1">
        {value}
      </p>
    </div>
  </div>
);

export function TicketPDF({
  bookingId: propBookingId,
  className,
  printMode = false,
}: TicketPDFProps) {
  const { bookingId: paramBookingId } = useParams<{ bookingId?: string }>();
  const bookingId = propBookingId || paramBookingId;
  const { currentBooking } = useBookingStore();

  // If no booking data available
  if (
    !currentBooking ||
    !currentBooking.tickets ||
    currentBooking.tickets.length === 0
  ) {
    return (
      <div
        className={cn(
          "p-8 bg-neutral-900 text-white min-h-[300px] flex items-center justify-center",
          className
        )}
      >
        <div className="text-center">
          <TicketIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-neutral-300">
            No ticket information available
          </h3>
          <p className="text-neutral-500 mt-2">
            Please check your booking details
          </p>
        </div>
      </div>
    );
  }

  console.log("Booking data:", currentBooking);

  // Cast tickets to extended type
  const tickets = currentBooking.tickets as unknown as ExtendedTicket[];
  const firstTicket = tickets[0];

  // Calculate the show duration
  const calculateDuration = () => {
    try {
      const startTime = firstTicket?.section?.showtime?.startTime;
      const endTime = firstTicket?.section?.showtime?.endTime;

      if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end.getTime() - start.getTime();
        const durationMins = Math.round(durationMs / (1000 * 60));

        return `${durationMins} mins`;
      }
    } catch (e) {
      console.error("Error calculating duration:", e);
    }

    return "90 mins (approx.)";
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
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
    return time
      .toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();
  };

  // Format booking reference ID
  const formatBookingRef = (id: string) => {
    return id.substring(0, 8).toUpperCase();
  };

  // Get show information
  const getShowTitle = () => {
    return (
      firstTicket?.section?.showtime?.event?.show?.title ||
      "Kunal Kamra Live Show"
    );
  };

  const getShowDate = () => {
    return formatDate(firstTicket?.section?.showtime?.event?.date);
  };

  const getShowTime = () => {
    return formatTime(firstTicket?.section?.showtime?.startTime);
  };

  const getVenue = () => {
    const venue = firstTicket?.section?.showtime?.event?.show?.venue;
    return venue
      ? `${venue.name}${venue.city ? `, ${venue.city}` : ""}`
      : "N/A";
  };

  const getSectionName = (ticket: ExtendedTicket) => {
    return ticket?.section?.name || ticket._sectionName || "Standard";
  };

  return (
    <div
      className={cn(
        "bg-[#111] text-white p-6 max-w-[800px] mx-auto",
        printMode ? "border-0" : "border border-neutral-800 rounded-2xl",
        className
      )}
    >
      {/* E-Ticket Header */}
      <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold">E-TICKET</h1>
          <p className="text-neutral-400 text-sm">
            Booking Ref: {formatBookingRef(currentBooking.id)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <img
            src="/assets/logo.png"
            alt="Logo"
            className="h-8"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-lg font-medium">Kunal Kamra Events</span>
        </div>
      </div>

      {/* Show Details Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[#AEE301]">
          {getShowTitle()}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <InfoItem
            icon={<Calendar size={20} strokeWidth={1.5} />}
            label="Date"
            value={getShowDate()}
          />

          <InfoItem
            icon={<Clock size={20} strokeWidth={1.5} />}
            label="Time"
            value={getShowTime()}
          />

          <InfoItem
            icon={<MapPin size={20} strokeWidth={1.5} />}
            label="Venue"
            value={getVenue()}
          />

          <InfoItem
            icon={<Info size={20} strokeWidth={1.5} />}
            label="Duration"
            value={calculateDuration()}
          />
        </div>
      </div>

      {/* Ticket Details */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4 border-b border-neutral-800 pb-2">
          Ticket Details ({tickets.length})
        </h3>

        <div className="space-y-6">
          {tickets.map((ticket, index) => (
            <div
              key={ticket.id}
              className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border",
                index === 0
                  ? "border-[#AEE301]/30 bg-[#AEE301]/5"
                  : "border-neutral-800 bg-neutral-900/50"
              )}
            >
              {/* Left: QR Code */}
              <div className="flex justify-center items-center bg-white p-3 rounded-lg">
                <QRCode
                  value={ticket.code || ticket.id}
                  size={100}
                  className="h-auto w-full max-w-[100px]"
                />
              </div>

              {/* Middle: Ticket Info */}
              <div className="flex flex-col justify-center md:col-span-2">
                <div className="flex justify-between mb-1">
                  <p className="text-sm text-neutral-400">
                    Ticket #{index + 1}
                  </p>
                  <p className="text-sm font-medium text-white">
                    {ticket.currency === "INR" ? "₹" : ticket.currency}{" "}
                    {ticket.price.toLocaleString()}
                  </p>
                </div>

                <div className="mb-1">
                  <p className="text-base font-medium">
                    {getSectionName(ticket)}
                    {ticket.seatNumber && ` | Seat ${ticket.seatNumber}`}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-xs text-neutral-500">
                    Ticket ID: {ticket.id.substring(0, 16)}
                  </p>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full",
                      ticket.status === "SOLD"
                        ? "bg-green-900/30 text-green-400 border border-green-600/30"
                        : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                    )}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-neutral-800 pt-4 text-sm text-neutral-400">
        <div className="flex justify-between mb-2">
          <span>Booking Date</span>
          <span>{formatDate(currentBooking.createdAt?.toString())}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Payment Status</span>
          <span
            className={cn(
              "px-2 py-0.5 text-xs rounded-full",
              currentBooking.status === "PAID"
                ? "bg-green-900/30 text-green-400 border border-green-600/30"
                : "bg-amber-900/30 text-amber-400 border border-amber-600/30"
            )}
          >
            {currentBooking.status}
          </span>
        </div>
        <div className="flex justify-between font-medium text-base mt-4">
          <span>Total Amount Paid</span>
          <span className="text-[#AEE301]">
            {currentBooking.currency === "INR" ? "₹" : currentBooking.currency}{" "}
            {currentBooking.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mt-6 pt-4 border-t border-neutral-800 text-xs text-neutral-500">
        <p className="mb-1">
          <strong>Important Notes:</strong>
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Please arrive at least 30 minutes before the show starts.</li>
          <li>
            E-tickets must be shown at the entrance (printed or on mobile).
          </li>
          <li>
            The venue reserves the right to refuse entry without a valid ticket.
          </li>
          <li>No refunds or exchanges except in case of show cancellation.</li>
        </ul>

        <p className="mt-4 text-center text-neutral-600">
          This ticket is powered by Kunal Kamra Events | For support:
          contact@kunalkamra.events
        </p>
      </div>
    </div>
  );
}

export default TicketPDF;
