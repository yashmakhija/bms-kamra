import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle,
  Loader2,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { useBookingStore } from "../../store/bookings";
import { formatDate, formatTime } from "../../utils/date-utils";

// Extended Ticket type with additional properties that might be added by the API
interface ExtendedTicket {
  id: string;
  seatNumber?: string;
  code: string;
  status: string;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  sectionId: string;
  // Additional properties returned from the API
  _sectionName?: string;
  _showDetails?: {
    title: string;
    date: string;
    startTime: string;
    venue: string;
    location: string;
  };
}

export function BookingSuccess() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { currentBooking, bookingError, isCreatingBooking, getBookingById } =
    useBookingStore();

  useEffect(() => {
    if (bookingId && (!currentBooking || currentBooking.id !== bookingId)) {
      getBookingById(bookingId);
    }
  }, [bookingId, currentBooking, getBookingById]);

  // Loading state
  if (isCreatingBooking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] p-4">
        <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">
          Loading booking details
        </h2>
        <p className="text-gray-400 text-center">
          Please wait while we fetch your booking information...
        </p>
      </div>
    );
  }

  // Error state
  if (bookingError || !currentBooking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] p-4">
        <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-semibold text-red-600 mb-2">
          Booking Not Found
        </h2>
        <p className="text-gray-400 text-center max-w-md mb-6">
          {bookingError ||
            "We couldn't find the booking details you're looking for."}
        </p>
        <Button
          onClick={() => navigate("/")}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    );
  }

  // Cast tickets to extended type
  const tickets = currentBooking.tickets as unknown as ExtendedTicket[];
  const firstTicket = tickets[0];
  const hasShowDetails = tickets.length > 0 && firstTicket._showDetails;

  // Success state with booking details
  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-400">
              Your tickets have been booked successfully. Here are your booking
              details.
            </p>
          </div>

          <div className="bg-gradient-to-b from-[#1e1e1e] to-[#171717] rounded-3xl p-6 shadow-xl border border-neutral-800/50 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-400 text-sm">Booking Reference</p>
                <p className="text-white text-lg font-mono">
                  {currentBooking.id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-600/30">
                  {currentBooking.status}
                </span>
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Event Details
              </h2>

              {hasShowDetails && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    {firstTicket._showDetails?.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-400 text-sm">Date</p>
                        <p className="text-white">
                          {firstTicket._showDetails?.date
                            ? formatDate(firstTicket._showDetails.date)
                            : "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-400 text-sm">Time</p>
                        <p className="text-white">
                          {firstTicket._showDetails?.startTime
                            ? formatTime(firstTicket._showDetails.startTime)
                            : "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-400 text-sm">Venue</p>
                        <p className="text-white">
                          {firstTicket._showDetails?.venue || "Not available"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {firstTicket._showDetails?.location || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-800 pt-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Ticket Details
              </h2>

              <div className="space-y-3">
                {tickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="bg-neutral-800/50 rounded-lg p-4 flex flex-col md:flex-row justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">
                        Ticket #{index + 1}
                        {ticket.seatNumber && ` - Seat ${ticket.seatNumber}`}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {ticket._sectionName || "Standard"} Section
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Code: {ticket.code}
                      </p>
                    </div>
                    <div className="md:text-right mt-2 md:mt-0">
                      <p className="text-gray-400 text-sm">Price</p>
                      <p className="text-white font-medium">
                        {ticket.currency === "INR" ? "₹" : ticket.currency}{" "}
                        {ticket.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">
                  {currentBooking.currency === "INR"
                    ? "₹"
                    : currentBooking.currency}{" "}
                  {(currentBooking.totalAmount * 0.95).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Service Fee (5%)</span>
                <span className="text-white">
                  {currentBooking.currency === "INR"
                    ? "₹"
                    : currentBooking.currency}{" "}
                  {(currentBooking.totalAmount * 0.05).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-neutral-700 pt-4">
                <span>Total</span>
                <span className="text-red-500">
                  {currentBooking.currency === "INR"
                    ? "₹"
                    : currentBooking.currency}{" "}
                  {currentBooking.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                // In a real app, this would trigger ticket download/print
                alert("In a real app, this would download your tickets");
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Tickets
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
