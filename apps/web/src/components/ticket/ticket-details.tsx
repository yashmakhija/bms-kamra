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
import { cn } from "@repo/ui/utils";
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
          <div className="bg-neutral-800 h-auto rounded-3xl p-6  lg:top-32 self-start shadow-xl border border-neutral-800/50">
            <div className="space-y-6">
              <h1 className="text-xl font-semibold text-neutral-100 leading-7">
                {ticket.title}
              </h1>

              <div className="space-y-4 mt-6">
                {/* Event Selection - only show if multiple events */}
                <div className="flex items-start gap-3">
                  <div className="text-[#AEE301]">
                    <Calendar size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs font-normal leading-none">
                      Date
                    </p>
                    <Select
                      value={selectedEventId}
                      onValueChange={handleEventChange}
                    >
                      <SelectTrigger className="w-full bg-transparent border-0 p-0 text-white hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none h-auto">
                        <SelectValue placeholder="Select date">
                          <div className="flex items-center ">
                            {selectedEventId && ticket?.events ? (
                              <span className="text-base leading-snug font-normal text-white">
                                {formatDate(
                                  ticket.events
                                    .find((e) => e.id === selectedEventId)
                                    ?.date.toString() || ""
                                )}
                              </span>
                            ) : (
                              <span>Select date</span>
                            )}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        className="bg-neutral-900 border border-neutral-700 text-white max-h-[300px] p-0 rounded-lg shadow-lg"
                        position="popper"
                        sideOffset={4}
                        align="center"
                      >
                        <div className="py-2 px-3 border-b border-neutral-700 bg-neutral-800">
                          <h4 className="text-sm font-medium text-white">
                            Available Dates
                          </h4>
                        </div>
                        <div className="py-1">
                          {ticket?.events?.map((event) => (
                            <SelectItem
                              key={event.id}
                              value={event.id}
                              className="cursor-pointer transition-colors data-[highlighted]:bg-neutral-800 data-[state=checked]:bg-neutral-800 data-[highlighted]:text-white rounded-none px-3 py-2.5"
                            >
                              <div className="flex items-center">
                                {selectedEventId === event.id ? (
                                  <div className="h-5 w-5 rounded-full border border-red-500 flex items-center justify-center mr-2 flex-shrink-0">
                                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                  </div>
                                ) : (
                                  <div className="h-5 w-5 rounded-full border border-neutral-600 mr-2 flex-shrink-0"></div>
                                )}
                                <CalendarDays className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                                <span>{formatDate(event.date.toString())}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Showtime Selection - only show if showtimes available */}
                <div className="flex items-start gap-3">
                  <div className="text-[#AEE301]">
                    <Clock size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs font-normal leading-none">
                      Time
                    </p>
                    <Select
                      value={selectedShowtimeId}
                      onValueChange={handleShowtimeChange}
                    >
                      <SelectTrigger className="w-full bg-transparent border-0 p-0 text-white hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none h-auto">
                        <SelectValue placeholder="Select time">
                          <div className="flex items-center">
                            {selectedShowtimeId && availableShowtimes ? (
                              <span className="text-base leading-snug font-normal text-white">
                                {formatTime(
                                  availableShowtimes.find(
                                    (st) => st.id === selectedShowtimeId
                                  )?.startTime || ""
                                )}
                              </span>
                            ) : (
                              <span>Select time</span>
                            )}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        className="bg-neutral-900 border border-neutral-700 text-white max-h-[300px] p-0 rounded-lg shadow-lg"
                        position="popper"
                        sideOffset={4}
                        align="center"
                      >
                        <div className="py-2 px-3 border-b border-neutral-700 bg-neutral-800">
                          <h4 className="text-sm font-medium text-white">
                            Available Times
                          </h4>
                        </div>
                        <div className="py-1">
                          {availableShowtimes.map((showtime) => (
                            <SelectItem
                              key={showtime.id}
                              value={showtime.id}
                              className="cursor-pointer transition-colors data-[highlighted]:bg-neutral-800 data-[state=checked]:bg-neutral-800 data-[highlighted]:text-white rounded-none px-3 py-2.5"
                            >
                              <div className="flex items-center">
                                {selectedShowtimeId === showtime.id ? (
                                  <div className="h-5 w-5 rounded-full border border-red-500 flex items-center justify-center mr-2 flex-shrink-0">
                                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                  </div>
                                ) : (
                                  <div className="h-5 w-5 rounded-full border border-neutral-600 mr-2 flex-shrink-0"></div>
                                )}
                                <Clock3 className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                                <span>{formatTime(showtime.startTime)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Venue */}
                <div className="flex items-start gap-3">
                  <div className="text-[#AEE301]">
                    <MapPin size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs font-normal leading-none">
                      Venue
                    </p>
                    <p className="text-base leading-snug font-normal text-white">
                      {ticket.venue}
                    </p>
                  </div>
                </div>

                {/* Ticket Quantity Selection */}
                <div className="flex items-start gap-3">
                  <div className="text-[#AEE301]">
                    <TicketIcon size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs font-normal leading-none">
                      Tickets
                    </p>
                    <div className="flex gap-3 items-center mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 rounded-full p-0"
                        onClick={() =>
                          setSelectedTickets(Math.max(1, selectedTickets - 1))
                        }
                        disabled={selectedTickets <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-base leading-snug font-normal text-white">
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

                {/* Section Selection - simplified but visible */}
                {availableSections && availableSections.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="text-[#AEE301]">
                      <Armchair size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-xs font-normal leading-none">
                        Section
                      </p>
                      <Select
                        value={selectedSectionId}
                        onValueChange={setSelectedSectionId}
                      >
                        <SelectTrigger className="w-full bg-transparent border-0 p-0 text-white hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none h-auto">
                          <SelectValue placeholder="Select section">
                            <div className="flex items-center">
                              {selectedSectionId && availableSections ? (
                                <span className="text-base leading-snug font-normal text-white">
                                  {
                                    availableSections.find(
                                      (s) => s.id === selectedSectionId
                                    )?.name
                                  }
                                </span>
                              ) : (
                                <span>Select section</span>
                              )}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          className="bg-neutral-900 border border-neutral-700 text-white max-h-[300px] p-0 rounded-lg shadow-lg"
                          position="popper"
                          sideOffset={4}
                          align="center"
                        >
                          <div className="py-2 px-3 border-b border-neutral-700 bg-neutral-800">
                            <h4 className="text-sm font-medium text-white">
                              Available Sections
                            </h4>
                          </div>
                          <div className="py-1">
                            {availableSections.map((section) => (
                              <SelectItem
                                key={section.id}
                                value={section.id}
                                className="cursor-pointer transition-colors data-[highlighted]:bg-neutral-800 data-[state=checked]:bg-neutral-800 data-[highlighted]:text-white rounded-none px-3 py-2.5"
                              >
                                <div className="flex items-center">
                                  {selectedSectionId === section.id ? (
                                    <div className="h-5 w-5 rounded-full border border-red-500 flex items-center justify-center mr-2 flex-shrink-0">
                                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                    </div>
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border border-neutral-600 mr-2 flex-shrink-0"></div>
                                  )}
                                  <span>{section.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Hidden inputs - keeping hidden functionality */}
                <div className="hidden">
                  {/* Section Selection - only show if sections available */}
                  {availableSections && availableSections.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">
                        Select Section
                      </label>
                      <Select
                        value={selectedSectionId}
                        onValueChange={setSelectedSectionId}
                      >
                        <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-white">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Number of tickets */}
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      Number of Tickets
                    </label>
                    <Select
                      value={selectedTickets.toString()}
                      onValueChange={(value) =>
                        setSelectedTickets(parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-white">
                        <SelectValue placeholder="Select number of tickets" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? "ticket" : "tickets"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Separator line */}
              <div className="h-[2px] bg-neutral-700 "></div>

              {/* Price section */}
              <div className="flex mt-12 justify-between items-center">
                <div>
                  <p className="text-sm font-normal leading-tight text-white">
                    Starts from
                  </p>
                  <p className="text-2xl leading-none text-neutral-50 font-bold">
                    ₹{getCurrentSectionPrice().amount.toLocaleString()} Onwards
                  </p>
                </div>

                {/* Button */}
                <Button
                  type="button"
                  className="bg-[#e31001] hover:bg-[#d31001] text-white px-6 py-3 rounded-xl inline-flex justify-center items-center gap-2 overflow-hidden"
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
                      className="h-6 w-6 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 rounded-full p-0"
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
                    <SelectContent className="bg-neutral-900 border-neutral-700">
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
