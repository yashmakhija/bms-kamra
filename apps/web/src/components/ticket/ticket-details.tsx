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
  MessageCircle,
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
    <div className="bg-[#111] pt-24 px-4 md:px-10 py-12 min-h-screen text-white">
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
          className="mb-6 cursor-pointer text-white hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Desktop layout - 3 columns */}
        <div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src={ticket.thumbnailUrl}
                alt={ticket.title}
                className="w-full object-cover h-auto hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="self-stretch mt-4 px-6 bg-[#1d1d1d]/90 rounded-[32px] outline outline-offset-[-1px] outline-white/10 inline-flex flex-col justify-start items-start">
              <h1 className="text-2xl font-bold leading-loose self-stretch justify-center text-white mt-8 mb-2">
                {ticket.title}
              </h1>

              <h2 className="justify-center text-lg text-white font-bold leading-snug mt-6 mb-4">
                Description
              </h2>

              <div className="mb-8 self-stretch justify-center text-base space-y-4 text-neutral-100 font-normal leading-snug">
                {ticket.description.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Additional details section removed in favor of the new design */}
          </div>

          {/* Desktop Booking Panel */}
          <div className="bg-[#1d1d1d] rounded-3xl p-8 lg:sticky lg:top-32 self-start">
            {/* Event Info Cards */}
            <div className="space-y-5 mb-8">
              {/* Duration */}
              <div className="flex items-center gap-4">
                <div className="bg-neutral-800 rounded-2xl w-12 h-12 flex gap-2.5 items-center overflow-hidden justify-center">
                  <Timer className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-normal leading-snug">
                    Duration
                  </p>
                  <p className="text-neutral-100 justify-center text-base font-normal leading-snug">
                    {ticket.duration}
                  </p>
                </div>
              </div>

              {/* Min Age */}
              <div className="flex items-center gap-4">
                <div className="bg-neutral-800 rounded-2xl w-12 h-12 flex gap-2.5 items-center overflow-hidden justify-center">
                  <Info className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-normal leading-snug">
                    Min. Age
                  </p>
                  <p className="text-neutral-100 justify-center text-base font-normal leading-snug">
                    {ticket.ageLimit || "16 & above"}
                  </p>
                </div>
              </div>

              {/* Language */}
              <div className="flex items-center gap-4">
                <div className="bg-neutral-800 rounded-2xl w-12 h-12 flex gap-2.5 items-center overflow-hidden justify-center">
                  <MessageCircle className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-normal leading-snug">
                    Language
                  </p>
                  <p className="text-neutral-100 justify-center text-base font-normal leading-snug">
                    {ticket.language}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-4">
                <div className="bg-neutral-800 rounded-2xl w-12 h-12 flex gap-2.5 items-center overflow-hidden justify-center">
                  <Calendar className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-normal leading-snug">
                    Date
                  </p>
                  <p className="text-neutral-100 justify-center text-base font-normal leading-snug">
                    {ticket.date}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-4">
                <div className="bg-neutral-800 rounded-2xl w-12 h-12 flex gap-2.5 items-center overflow-hidden justify-center">
                  <Clock className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-normal leading-snug">
                    Time
                  </p>
                  <p className="text-neutral-100 justify-center text-base font-normal leading-snug">
                    {ticket.time}
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-center gap-4">
                <div className="bg-neutral-800 rounded-2xl w-12 h-12 flex gap-2.5 items-center overflow-hidden justify-center">
                  <MapPin className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs font-normal leading-snug">
                    Venue
                  </p>
                  <p className="text-neutral-100 justify-center text-base font-normal leading-snug">
                    {ticket.venue}
                  </p>
                </div>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="mb-4">
              <Select
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
              >
                <SelectTrigger className="w-full bg-[#2e2e2e] border-0 text-white rounded-2xl h-14 px-5">
                  <SelectValue placeholder="Category">
                    {selectedSectionId &&
                    availableSections &&
                    availableSections.length > 0
                      ? availableSections.find(
                          (s) => s.id === selectedSectionId
                        )?.name
                      : "Category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#2e2e2e] text-white border-[#2e2e2e]">
                  {availableSections && availableSections.length > 0 ? (
                    availableSections.map((section) => (
                      <SelectItem
                        key={section.id}
                        value={section.id}
                        className="hover:bg-[#3e3e3e] focus:bg-[#3e3e3e] cursor-pointer py-2"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>{section.name}</span>
                          <span className="text-[#F2F900]">
                            ₹{section.priceTier?.price}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>
                      No categories available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Section selection Dropdown */}
            <div className="mb-8">
              <div className="flex items-center justify-between w-full p-4 bg-[#2e2e2e] rounded-2xl h-14 px-5">
                <span className="text-white text-base">Select Seats</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 rounded-full p-0"
                    onClick={() =>
                      setSelectedTickets(Math.max(1, selectedTickets - 1))
                    }
                    disabled={selectedTickets <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-base text-white min-w-[20px] text-center">
                    {selectedTickets}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 rounded-full p-0"
                    onClick={() =>
                      setSelectedTickets(Math.min(10, selectedTickets + 1))
                    }
                    disabled={selectedTickets >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Price Display */}
            <div>
              <div className="flex items-center mb-3">
                <h3 className="text-4xl font-bold text-white leading-9">
                  ₹
                  {(
                    getCurrentSectionPrice().amount * selectedTickets
                  ).toLocaleString()}
                </h3>
                <span className="text-sm text-[#F1F1F1]/50 ml-2 mt-2 justify-center">
                  excl. of taxes
                </span>
              </div>
              <Button
                type="button"
                className="w-full bg-[#F2F900] hover:bg-[#F2F900]/90 text-black text-base font-medium h-14 rounded-full"
                onClick={handleProceedToPayment}
                disabled={!selectedSectionId || isCreatingBooking}
              >
                {isCreatingBooking ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Purchase"
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
          <h1 className=" self-stretch justify-center text-neutral-100 text-2xl font-bold mb-6">
            {ticket.title}
          </h1>
          {/* Description */}
          <div className="mb-8">
            <h2 className="justify-center text-white text-lg font-bold leading-snug mb-3">
              Description
            </h2>
            <div className="self-stretch justify-center text-neutral-100 text-base font-normal space-y-3">
              {ticket.description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Event Details with Icons */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="flex items-center gap-3">
                <div className="text-[#F2F900]  p-3 bg-[#1d1d1d] rounded-2xl inline-flex justify-start items-center gap-2.5 overflow-hidden">
                  <Timer className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs leading-none">
                    Duration
                  </p>
                  <p className="text-white text-base">{ticket.duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[#F2F900]  p-3 bg-[#1d1d1d] rounded-2xl inline-flex justify-start items-center gap-2.5 overflow-hidden">
                  <MessageCircle className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs">Language</p>
                  <p className="text-white text-sm">{ticket.language}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[#F2F900]  p-3 bg-[#1d1d1d] rounded-2xl inline-flex justify-start items-center gap-2.5 overflow-hidden">
                  <Clock className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs leading-none">Time</p>
                  <p className="text-white text-base">
                    {ticket.time || "8:00 PM"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[#F2F900]  p-3 bg-[#1d1d1d] rounded-2xl inline-flex justify-start items-center gap-2.5 overflow-hidden">
                  <Info className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs leading-none">
                    Min. Age
                  </p>
                  <p className="text-white text-base">
                    {ticket.ageLimit || "16 & above"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[#F2F900]  p-3 bg-[#1d1d1d] rounded-2xl inline-flex justify-start items-center gap-2.5 overflow-hidden">
                  <Calendar className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs leading-none">Date</p>
                  <p className="text-white text-base">{ticket.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[#F2F900]  p-3 bg-[#1d1d1d] rounded-2xl inline-flex justify-start items-center gap-2.5 overflow-hidden">
                  <MapPin className="text-[#F2F900] relative overflow-hidden h-6 w-6" />
                </div>
                <div>
                  <p className="text-neutral-400 text-xs leading-none">Venue</p>
                  <p className="text-white text-base">{ticket.venue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Options */}
          <div className="space-y-4 grid grid-cols-2 gap-4  mb-8">
            {/* Category Dropdown */}
            <div>
              <Select
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
              >
                <SelectTrigger className="w-full bg-[#2e2e2e] border-0 text-white rounded-2xl h-14 px-5">
                  <SelectValue placeholder="Category">
                    {selectedSectionId &&
                    availableSections &&
                    availableSections.length > 0
                      ? availableSections.find(
                          (s) => s.id === selectedSectionId
                        )?.name
                      : "Category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#2e2e2e] text-white border-[#2e2e2e]">
                  {availableSections && availableSections.length > 0 ? (
                    availableSections.map((section) => (
                      <SelectItem
                        key={section.id}
                        value={section.id}
                        className="hover:bg-[#3e3e3e] focus:bg-[#3e3e3e] cursor-pointer py-2"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>{section.name}</span>
                          <span className="text-[#F2F900]">
                            ₹{section.priceTier?.price}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>
                      No categories available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Number of Tickets */}
            <div className="flex items-center justify-between bg-[#2e2e2e] rounded-2xl h-14 px-5">
              <span className="text-white">Select Seats</span>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-neutral-800 text-white hover:bg-neutral-700"
                  onClick={() =>
                    setSelectedTickets(Math.max(1, selectedTickets - 1))
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-white w-5 text-center">
                  {selectedTickets}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-neutral-800 text-white hover:bg-neutral-700"
                  onClick={() =>
                    setSelectedTickets(Math.min(10, selectedTickets + 1))
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Display */}
      <div className="flex px-4 py-6 rounded-2xl self-stretch bg-[#1d1d1d] lg:hidden justify-between items-center">
        <div>
          <h3 className="text-4xl ml-4 font-bold text-white">
            ₹
            {(
              getCurrentSectionPrice().amount * selectedTickets
            ).toLocaleString()}
          </h3>
          <span className="text-sm ml-4 text-white/50">excl. of taxes</span>
        </div>
        <Button
          type="button"
          className="bg-[#F2F900] hover:bg-[#F2F900]/90 text-black text-base font-medium h-14 px-8 rounded-full"
          onClick={handleProceedToPayment}
          disabled={!selectedSectionId || isCreatingBooking}
        >
          {isCreatingBooking ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            "Purchase"
          )}
        </Button>
      </div>

      {/* Similar Shows */}
      <div className="mt-30">
        <UpcomingShows title="Similar Shows" limit={4} />
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
