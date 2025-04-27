import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTicketStore } from "../../store/tickets";
import { useAuthStore } from "../../store/auth";
import { useBookingStore } from "../../store/bookings";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket as TicketIcon,
  ArrowLeft,
  Minus,
  Plus,
  AlertCircle,
  Loader2,
  Users,
  CalendarDays,
  Clock3,
  Armchair,
  Info,
  Timer,
} from "lucide-react";
import { LatestUploads } from "../home/latestupload";
import { latestShows } from "../../data/upload";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Button } from "@repo/ui/components/ui/button";
import { SimpleAuthModal } from "../auth/simple-auth-modal";
import { PaymentModal } from "../booking/payment-modal";
import { UpcomingShows } from "../home/upcoming-shows";

export function TicketDetails() {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { ticket, isLoading, hasError, errorMessage, loadTicket } =
    useTicketStore();
  const { isAuthenticated } = useAuthStore();
  const { createBooking, currentBooking, bookingError, isCreatingBooking } =
    useBookingStore();

  const [selectedTickets, setSelectedTickets] = useState<number>(1);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [availableShowtimes, setAvailableShowtimes] = useState<any[]>([]);
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  // Load ticket details when component mounts or showId changes
  useEffect(() => {
    if (showId) {
      loadTicket(showId);
    }
  }, [showId, loadTicket]);

  // Set up available options when ticket data is loaded
  useEffect(() => {
    if (ticket && ticket.events && ticket.events.length > 0) {
      // Select first event by default
      const firstEvent = ticket.events[0];
      setSelectedEventId(firstEvent.id);

      // Get showtimes for the first event
      if (firstEvent.showtimes && firstEvent.showtimes.length > 0) {
        setAvailableShowtimes(firstEvent.showtimes);

        // Select first showtime by default
        const firstShowtime = firstEvent.showtimes[0];
        setSelectedShowtimeId(firstShowtime.id);

        // Get sections for the first showtime
        if (
          firstShowtime.seatSections &&
          firstShowtime.seatSections.length > 0
        ) {
          setAvailableSections(firstShowtime.seatSections);

          // Select first section by default
          setSelectedSectionId(firstShowtime.seatSections[0].id);
        }
      }
    }
  }, [ticket]);

  // Update showtimes when event changes
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);

    if (ticket && ticket.events) {
      const selectedEvent = ticket.events.find((event) => event.id === eventId);
      if (
        selectedEvent &&
        selectedEvent.showtimes &&
        selectedEvent.showtimes.length > 0
      ) {
        setAvailableShowtimes(selectedEvent.showtimes);
        setSelectedShowtimeId(selectedEvent.showtimes[0].id);

        // Update sections based on the first showtime
        if (
          selectedEvent.showtimes[0].seatSections &&
          selectedEvent.showtimes[0].seatSections.length > 0
        ) {
          setAvailableSections(selectedEvent.showtimes[0].seatSections);
          setSelectedSectionId(selectedEvent.showtimes[0].seatSections[0].id);
        } else {
          setAvailableSections([]);
          setSelectedSectionId("");
        }
      } else {
        setAvailableShowtimes([]);
        setSelectedShowtimeId("");
        setAvailableSections([]);
        setSelectedSectionId("");
      }
    }
  };

  // Update sections when showtime changes
  const handleShowtimeChange = (showtimeId: string) => {
    setSelectedShowtimeId(showtimeId);

    if (availableShowtimes && availableShowtimes.length > 0) {
      const selectedShowtime = availableShowtimes.find(
        (showtime) => showtime.id === showtimeId
      );
      if (
        selectedShowtime &&
        selectedShowtime.seatSections &&
        selectedShowtime.seatSections.length > 0
      ) {
        setAvailableSections(selectedShowtime.seatSections);
        setSelectedSectionId(selectedShowtime.seatSections[0].id);
      } else {
        setAvailableSections([]);
        setSelectedSectionId("");
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    // Convert string to Date object first
    const time = new Date(timeString);
    return time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Find selected showtime details
  const selectedShowtime = availableShowtimes.find(
    (st) => st.id === selectedShowtimeId
  );
  const showtimeString = selectedShowtime ? selectedShowtime.startTime : "";

  // Get current section price
  const getCurrentSectionPrice = () => {
    if (!availableSections || !selectedSectionId)
      return { amount: 0, currency: "₹" };

    const section = availableSections.find(
      (section) => section.id === selectedSectionId
    );
    if (section && section.priceTier) {
      return {
        amount: Number(section.priceTier.price),
        currency:
          section.priceTier.currency === "INR"
            ? "₹"
            : section.priceTier.currency || "₹",
      };
    }

    return { amount: 0, currency: "₹" };
  };

  // Calculate total price
  const calculateTotal = () => {
    const price = getCurrentSectionPrice();
    return price.amount * selectedTickets;
  };

  // Handle booking
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      // Open auth modal instead of showing an alert
      setAuthModalOpen(true);
      return;
    }

    if (!selectedSectionId || !selectedShowtimeId) {
      alert("Please select a showtime and section to continue");
      return;
    }

    try {
      setBookingInProgress(true);

      // Create booking via booking store
      const booking = await createBooking({
        showtimeId: selectedShowtimeId,
        sectionId: selectedSectionId,
        quantity: selectedTickets,
      });

      setBookingInProgress(false);

      if (booking && booking.id) {
        console.log("Booking created successfully:", booking.id);

        // Explicitly store in localStorage to ensure it's available for payment modal
        localStorage.setItem("current_booking_id", booking.id);

        // Open payment modal with the booking ID
        setPaymentModalOpen(true);
      } else {
        console.error("Booking creation failed - no booking returned");
        alert("Failed to create booking. Please try again.");
      }
    } catch (error) {
      setBookingInProgress(false);
      console.error("Failed to create booking:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create booking. Please try again."
      );
    }
  };

  // Fix the SimpleAuthModal implementation
  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Handle payment modal close
  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f]">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="text-white text-lg">Loading ticket details...</p>
      </div>
    );
  }

  // Error state
  if (hasError || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-10 bg-[#0f0f0f]">
        <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-red-600">Ticket not found</h2>
        <p className="mt-2 text-center text-gray-400 max-w-md">
          {errorMessage ||
            "The ticket you're looking for doesn't exist or has been removed."}
        </p>
        <Button
          variant="outline"
          className="mt-6 text-white border-white/20 hover:bg-white/10"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 pt-24 px-4 md:px-10 py-12 min-h-screen text-white">
      {/* Auth modal - placed at the top level of the component */}
      <SimpleAuthModal
        className="text-black"
        isOpen={authModalOpen}
        onClose={handleCloseAuthModal}
      />

      {/* Payment modal */}
      {currentBooking && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={handleClosePaymentModal}
          bookingId={currentBooking.id}
        />
      )}

      <div className="container mx-auto  xl:px-30">
        <Button
          variant="ghost"
          className="mb-6 text-white hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Desktop layout - 3 columns */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src={ticket.thumbnailUrl}
                alt={ticket.title}
                className="w-full object-cover h-auto hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h1 className="text-xl text-neutral-100 font-semibold mt-4 mb-2 leading-tight">
              Description
            </h1>
            {ticket.subtitle && (
              <h2 className="text-xl text-neutral-400 mb-6">
                {ticket.subtitle}
              </h2>
            )}
            <div className="mb-8 text-base leading-snug space-y-4">
              {ticket.description.map((paragraph, index) => (
                <p key={index} className="text-gray-300">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="self-stretch h-0 outline outline-offset-[-0.50px] outline-neutral-700"></div>

            <div className="flex flex-wrap items-center gap-15 mt-16">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-neutral-800 rounded-2xl inline-flex justify-start items-center gap-2.5 overflow-hidden ">
                  <Clock size={20} color="#AEE301" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white text-lg mt-1">{ticket.duration}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-neutral-800 rounded-2xl inline-flex justify-start items-center gap-2.5 overflow-hidden ">
                  <Info size={20} color="#AEE301" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Min. Age</p>
                  <p className="text-white text-lg mt-1">{ticket.ageLimit}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-neutral-800 rounded-2xl inline-flex justify-start items-center gap-2.5 overflow-hidden ">
                  <Calendar size={20} color="#AEE301" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white text-lg mt-1">{ticket.date}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Booking Panel */}
          <div className="bg-neutral-800 h-auto rounded-xl p-5 lg:sticky lg:top-32 self-start border border-neutral-800/60">
            <h1 className="text-xl font-semibold text-white mb-4">
              Book Tickets
            </h1>

            {/* Dates - horizontal scroll */}
            <div className="mb-4">
              <p className="text-xs text-neutral-400 mb-2">Date</p>
              <div className="flex overflow-x-auto space-x-1.5 pb-1 hide-scrollbar">
                {ticket?.events?.map((event) => {
                  const date = new Date(event.date);
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleEventChange(event.id)}
                      className={`flex-shrink-0 py-2 px-3 rounded-lg flex flex-col items-center transition-all ${
                        selectedEventId === event.id
                          ? "bg-[#e31001] text-white"
                          : "bg-neutral-900 text-neutral-300 hover:bg-neutral-900"
                      }`}
                    >
                      <span className="text-xs">
                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="text-base font-bold">
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Times - chips */}
            <div className="mb-4">
              <p className="text-xs text-neutral-400 mb-2">Time</p>
              <div className="flex flex-wrap gap-1.5">
                {availableShowtimes.map((showtime) => {
                  const time = new Date(showtime.startTime);
                  return (
                    <button
                      key={showtime.id}
                      onClick={() => handleShowtimeChange(showtime.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        selectedShowtimeId === showtime.id
                          ? "bg-[#e31001] text-white"
                          : "bg-neutral-900 text-neutral-300 hover:bg-neutral-700"
                      }`}
                    >
                      {time.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sections - minimal list */}
            {availableSections && availableSections.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-neutral-400 mb-2">Section</p>
                <div className="space-y-1.5">
                  {availableSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSectionId(section.id)}
                      className={` w-full rounded-lg flex justify-between items-center p-2.5 ${
                        selectedSectionId === section.id
                          ? "bg-neutral-800 border-l-4 border-l-[#e31001]"
                          : "bg-neutral-800/50 hover:bg-neutral-800"
                      }`}
                    >
                      <span className="text-sm text-white">{section.name}</span>
                      <span
                        className={`text-sm font-medium ${selectedSectionId === section.id ? "text-[#e31001]" : "text-white"}`}
                      >
                        ₹{Number(section.priceTier.price).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity - simple counter */}
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-neutral-400">Tickets</p>
                <div className="flex items-center">
                  <button
                    onClick={() =>
                      setSelectedTickets(Math.max(1, selectedTickets - 1))
                    }
                    disabled={selectedTickets <= 1}
                    className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-white disabled:opacity-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium text-white mx-3">
                    {selectedTickets}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedTickets(Math.min(10, selectedTickets + 1))
                    }
                    disabled={selectedTickets >= 10}
                    className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-white disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Venue - condensed */}
            <div className="flex items-center text-xs text-neutral-400 mb-4">
              <MapPin className="text-[#e31001] mr-1.5" size={14} />
              <span>{ticket.venue}</span>
            </div>

            {/* Separator */}
            <div className="h-px bg-neutral-800 mb-4"></div>

            {/* Price and booking */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-neutral-400">Total</p>
                <p className="text-xl font-bold text-white">
                  ₹
                  {(
                    getCurrentSectionPrice().amount * selectedTickets
                  ).toLocaleString()}
                </p>
              </div>
              <Button
                type="button"
                className="bg-[#e31001] hover:bg-[#d31001] text-white px-4 py-2 h-auto rounded-lg"
                disabled={isCreatingBooking || !selectedSectionId}
                onClick={handleProceedToPayment}
              >
                {isCreatingBooking ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Buy Now"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile and Tablet Layout */}
        <div className="lg:hidden">
          {/* Banner Image */}
          <div className="overflow-hidden rounded-2xl shadow-xl mb-6">
            <img
              src={ticket.thumbnailUrl}
              alt={ticket.title}
              className="w-full object-cover h-auto"
            />
          </div>

          {/* Title and basic info */}
          <h1 className="text-2xl font-semibold text-white mb-6">
            {ticket.title}
          </h1>

          {/* Event Details with Icons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="text-[#AEE301]">
                <Calendar size={20} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-neutral-400 text-xs leading-none">Date</p>
                <p className="text-white text-base">{ticket.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-[#AEE301]">
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-neutral-400 text-xs leading-none">Time</p>
                <p className="text-white text-base">
                  {ticket.time || "8:00 PM"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-[#AEE301]">
                <Timer size={20} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-neutral-400 text-xs leading-none">
                  Duration
                </p>
                <p className="text-white text-base">{ticket.duration}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-[#AEE301]">
                <MapPin size={20} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-neutral-400 text-xs leading-none">Venue</p>
                <p className="text-white text-base">{ticket.venue}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-medium text-white mb-3">Description</h2>
            <div className="text-gray-300 space-y-3">
              {ticket.description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-neutral-800 rounded-2xl p-4 flex items-center">
              <div className="bg-neutral-900 rounded-full p-3 mr-3">
                <Timer className="text-[#AEE301] h-5 w-5" />
              </div>
              <div>
                <p className="text-neutral-400 text-xs">Duration</p>
                <p className="text-white text-sm">{ticket.duration}</p>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-2xl p-4 flex items-center">
              <div className="bg-neutral-900 rounded-full p-3 mr-3">
                <Info className="text-[#AEE301] h-5 w-5" />
              </div>
              <div>
                <p className="text-neutral-400 text-xs">Min. Age</p>
                <p className="text-white text-sm">
                  {ticket.ageLimit || "16 & above"}
                </p>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-2xl p-4 flex items-center">
              <div className="bg-neutral-900 rounded-full p-3 mr-3">
                <Users className="text-[#AEE301] h-5 w-5" />
              </div>
              <div>
                <p className="text-neutral-400 text-xs">Language</p>
                <p className="text-white text-sm">English & Hindi</p>
              </div>
            </div>
          </div>

          {/* Booking Options */}
          <div className="bg-neutral-800 rounded-2xl p-5 mb-6">
            {/* Ticket Selection */}
            <div className="flex items-start gap-3 mb-5">
              <div className="text-[#AEE301]">
                <TicketIcon size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-neutral-400 text-xs mb-1">Tickets</p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6  bg-neutral-700 border-neutral-600 hover:bg-neutral-600 rounded-full p-0"
                      onClick={() =>
                        setSelectedTickets(Math.max(1, selectedTickets - 1))
                      }
                      disabled={selectedTickets <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-base text-white">
                      {selectedTickets}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 rounded-full p-0"
                      onClick={() =>
                        setSelectedTickets(Math.min(10, selectedTickets + 1))
                      }
                      disabled={selectedTickets >= 10}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Selection */}
            {availableSections && availableSections.length > 0 && (
              <div className="flex items-start gap-3 mb-5">
                <div className="text-[#AEE301]">
                  <Armchair size={20} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="text-neutral-400 text-xs mb-1">Section</p>
                  <Select
                    value={selectedSectionId}
                    onValueChange={setSelectedSectionId}
                  >
                    <SelectTrigger className="w-full bg-neutral-700 border-0 text-white rounded-lg h-10">
                      <SelectValue placeholder="Select section">
                        {selectedSectionId && availableSections
                          ? availableSections.find(
                              (s) => s.id === selectedSectionId
                            )?.name
                          : "Select section"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className=" text-white bg-neutral-700 mt-1 border-neutral-700">
                      {availableSections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Fixed Bar with Price and Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-neutral-800 p-4 border-t border-neutral-700 flex justify-between items-center z-10">
            <div>
              <p className="text-xs text-neutral-400">Starts from</p>
              <p className="text-xl text-white font-bold">
                ₹{getCurrentSectionPrice().amount.toLocaleString()}{" "}
                <span className="text-xs font-normal">Onwards</span>
              </p>
            </div>
            <Button
              type="button"
              className="bg-[#e31001] hover:bg-[#d31001] text-white px-6 py-3 rounded-xl inline-flex justify-center items-center gap-2"
              disabled={isCreatingBooking || !selectedSectionId}
              onClick={handleProceedToPayment}
            >
              {isCreatingBooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Buy Now"
              )}
            </Button>
          </div>

          {/* Spacer to prevent content from being hidden behind fixed bottom bar */}
          <div className="h-20"></div>
        </div>
      </div>

      {/* Similar Shows */}
      <div className="mt-30">
        <UpcomingShows title="Similar Shows" limit={3} />
      </div>

      {/* Related Shows */}
      <div className="mt-16">
        <LatestUploads shows={latestShows} />
      </div>

      {/* Error message */}
      {bookingError && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-600/30 rounded-lg text-center">
          <p className="text-red-400 text-sm">{bookingError}</p>
        </div>
      )}
    </div>
  );
}
