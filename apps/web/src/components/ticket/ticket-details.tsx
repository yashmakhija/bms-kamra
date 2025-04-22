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
import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/utils";
import { SimpleAuthModal } from "../auth/simple-auth-modal";
import { PaymentModal } from "../booking/payment-modal";

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
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#0f0f0f]">
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
    <div className="bg-[#0f0f0f] pt-24 min-h-screen text-white">
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

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-white hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img
                src={ticket.thumbnailUrl}
                alt={ticket.title}
                className="w-full object-cover h-auto hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              {ticket.language && (
                <Badge className="bg-red-600 hover:bg-red-700 text-white px-3 py-1">
                  {ticket.language}
                </Badge>
              )}
              {ticket.ageLimit && (
                <Badge className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1">
                  {ticket.ageLimit}
                </Badge>
              )}
              <Badge className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1">
                {ticket.duration}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl text-neutral-100 font-semibold mt-4 mb-2 leading-tight">
              {ticket.title}
            </h1>
            {ticket.subtitle && (
              <h2 className="text-xl text-neutral-400 mb-6">
                {ticket.subtitle}
              </h2>
            )}

            <div className="mb-8 text-lg leading-relaxed space-y-4">
              {ticket.description.map((paragraph, index) => (
                <p key={index} className="text-gray-300">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 border border-neutral-800 rounded-xl p-6 bg-neutral-900/50 backdrop-blur-sm">
              <h3 className="text-xl font-medium mb-4 text-white/90">
                Show Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-neutral-800 p-2 rounded-lg">
                    <Calendar size={20} color="#ff3b30" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Date</p>
                    <p className="text-white text-lg mt-1">{ticket.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-neutral-800 p-2 rounded-lg">
                    <Clock size={20} color="#ff3b30" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Duration</p>
                    <p className="text-white text-lg mt-1">{ticket.duration}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-neutral-800 p-2 rounded-lg">
                    <Clock size={20} color="#ff3b30" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Time</p>
                    <p className="text-white text-lg mt-1">{showtimeString}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-neutral-800 p-2 rounded-lg">
                    <MapPin size={20} color="#ff3b30" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Venue</p>
                    <p className="text-white text-lg mt-1">{ticket.venue}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {ticket.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#1e1e1e] to-[#171717] rounded-3xl p-6 lg:sticky lg:top-32 self-start shadow-xl border border-neutral-800/50">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <TicketIcon className="w-5 h-5 mr-2 text-red-500" />
                Book Tickets
              </h3>

              <div className="space-y-4">
                {/* Event Selection - only show if multiple events */}
                {ticket.events && ticket.events.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      Select Date
                    </label>
                    <Select
                      value={selectedEventId}
                      onValueChange={handleEventChange}
                    >
                      <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:border-neutral-600 transition-colors h-12">
                        <SelectValue placeholder="Select date">
                          <div className="flex items-center">
                            <CalendarDays className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                            {selectedEventId && ticket.events ? (
                              <span className="text-white">
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
                          {ticket.events.map((event) => (
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
                )}

                {/* Showtime Selection - only show if showtimes available */}
                {availableShowtimes && availableShowtimes.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      Select Time
                    </label>
                    <Select
                      value={selectedShowtimeId}
                      onValueChange={handleShowtimeChange}
                    >
                      <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:border-neutral-600 transition-colors h-12">
                        <SelectValue placeholder="Select time">
                          <div className="flex items-center">
                            <Clock3 className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                            {selectedShowtimeId && availableShowtimes ? (
                              <span className="text-white">
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
                )}

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
                      <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:border-neutral-600 transition-colors h-12">
                        <SelectValue placeholder="Select section">
                          <div className="flex items-center">
                            <Armchair className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                            {selectedSectionId && availableSections ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-white">
                                  {
                                    availableSections.find(
                                      (s) => s.id === selectedSectionId
                                    )?.name
                                  }
                                </span>
                              </div>
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
                              <div className="flex items-center justify-between w-full gap-4">
                                <div className="flex items-center">
                                  {selectedSectionId === section.id ? (
                                    <div className="h-5 w-5 rounded-full border border-red-500 flex items-center justify-center mr-2 flex-shrink-0">
                                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                    </div>
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border border-neutral-600 mr-2 flex-shrink-0"></div>
                                  )}
                                  <Armchair className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                                  <span>{section.name}</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
                    <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:border-neutral-600 transition-colors h-12">
                      <SelectValue placeholder="Select tickets">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {selectedTickets}{" "}
                              {selectedTickets === 1 ? "ticket" : "tickets"}
                            </span>
                          </div>
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
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white">
                            Quick Selection
                          </h4>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
                              onClick={() =>
                                setSelectedTickets(
                                  Math.max(1, selectedTickets - 1)
                                )
                              }
                              disabled={selectedTickets <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center font-medium">
                              {selectedTickets}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
                              onClick={() =>
                                setSelectedTickets(
                                  Math.min(10, selectedTickets + 1)
                                )
                              }
                              disabled={selectedTickets >= 10}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 p-3 border-b border-neutral-700">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <div key={num}>
                            <SelectItem
                              value={num.toString()}
                              className={cn(
                                "h-10 rounded-md text-sm font-medium flex items-center justify-center cursor-pointer m-0 p-0 data-[highlighted]:bg-transparent",
                                selectedTickets === num
                                  ? "bg-red-600 text-white hover:bg-red-600/90"
                                  : "bg-neutral-700 text-white hover:bg-neutral-600"
                              )}
                            >
                              <div className="flex items-center justify-center w-full h-full">
                                {num}
                              </div>
                            </SelectItem>
                          </div>
                        ))}
                      </div>

                      <div className="py-1 max-h-[150px] overflow-y-auto">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(
                          (num) => (
                            <SelectItem
                              key={`list-${num}`}
                              value={num.toString()}
                              className="cursor-pointer transition-colors data-[highlighted]:bg-neutral-800 data-[state=checked]:bg-neutral-800 data-[highlighted]:text-white rounded-none px-3 py-2.5"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  {selectedTickets === num ? (
                                    <div className="h-5 w-5 rounded-full border border-red-500 flex items-center justify-center mr-2 flex-shrink-0">
                                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                    </div>
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border border-neutral-600 mr-2 flex-shrink-0"></div>
                                  )}
                                  <Users className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
                                  <span>
                                    {num} {num === 1 ? "ticket" : "tickets"}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-300 font-medium">
                                  {getCurrentSectionPrice().currency}{" "}
                                  {(
                                    getCurrentSectionPrice().amount * num
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-800">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">
                      {getCurrentSectionPrice().currency}{" "}
                      {(
                        getCurrentSectionPrice().amount * selectedTickets
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Service Fee</span>
                    <span className="text-white">
                      {getCurrentSectionPrice().currency}{" "}
                      {(
                        getCurrentSectionPrice().amount *
                        selectedTickets *
                        0.05
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-4">
                    <span>Total</span>
                    <span className="text-red-500">
                      {getCurrentSectionPrice().currency}{" "}
                      {(
                        getCurrentSectionPrice().amount * selectedTickets +
                        getCurrentSectionPrice().amount * selectedTickets * 0.05
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full py-6 bg-[#e31001] hover:bg-[#d31001] text-white font-medium text-lg mt-4 rounded-xl transition-colors flex items-center justify-center"
                  disabled={isCreatingBooking || !selectedSectionId}
                  onClick={handleProceedToPayment}
                >
                  {isCreatingBooking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating booking...
                    </>
                  ) : isAuthenticated ? (
                    "Proceed to Payment"
                  ) : (
                    "Sign in to Book"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Shows */}
      <div className="mt-16 bg-[#171717]">
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
