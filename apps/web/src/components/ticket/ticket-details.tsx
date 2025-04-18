import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTicketStore } from "../../store/tickets";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  Ticket as TicketIcon,
  ArrowLeft,
  Minus,
  Plus,
  Users,
} from "lucide-react";
import { latestShows } from "../../data/upload";
import { LatestUploads } from "../home/latestupload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
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
import { motion } from "framer-motion";

export function TicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { ticket, isLoading, hasError, loadTicket } = useTicketStore();
  const [selectedTickets, setSelectedTickets] = useState<number>(2);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTickets, setAvailableTickets] = useState<string[]>([]);

  // Mock available ticket dates
  const ticketDates = [
    "26 Jan 2026",
    "27 Jan 2026",
    "28 Jan 2026",
    "29 Jan 2026",
  ];

  // Mock available show times
  const showTimes = ["4:00 PM", "6:30 PM", "8:00 PM", "10:30 PM"];

  useEffect(() => {
    // Set default selected date to the ticket's date if available
    if (ticket) {
      setSelectedDate(ticket.date);
      // In a real app, you'd fetch available tickets based on the selected date
      setAvailableTickets(showTimes);
    }
  }, [ticket]);

  useEffect(() => {
    if (ticketId) {
      loadTicket(ticketId);
    }
  }, [ticketId, loadTicket]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="w-8 h-8 border-3 border-t-red-600 border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasError || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#0f0f0f]">
        <h2 className="text-2xl font-bold text-red-600">Ticket not found</h2>
        <p className="mt-2 text-gray-400">
          The ticket you're looking for doesn't exist or has been removed.
        </p>
        <Button
          variant="outline"
          className="mt-6 text-white border-white/20 hover:bg-white/10"
          onClick={() => navigate("/tickets")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tickets
        </Button>
      </div>
    );
  }

  const calculateTotal = (): number => {
    if (!ticket.price) return 0;
    return ticket.price.amount * selectedTickets;
  };

  return (
    <div className="bg-[#0f0f0f] pt-24 min-h-screen text-white">
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
              <Badge className="bg-red-600 hover:bg-red-700 text-white px-3 py-1">
                {ticket.language}
              </Badge>
              <Badge className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1">
                {ticket.ageLimit}
              </Badge>
              <Badge className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1">
                {ticket.duration}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl text-neutral-100 font-semibold mt-4 mb-2 leading-tight">
              {ticket.title}
            </h1>
            <h2 className="text-xl text-neutral-400 mb-6">{ticket.subtitle}</h2>

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
                    <p className="text-white text-lg mt-1">{ticket.time}</p>
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
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Select Date
                  </label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                      {ticketDates.map((date) => (
                        <SelectItem
                          key={date}
                          value={date}
                          className="hover:bg-neutral-700 focus:bg-neutral-700"
                        >
                          {date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Select Time
                  </label>
                  <Select defaultValue={ticket.time}>
                    <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-white">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                      {availableTickets.map((time) => (
                        <SelectItem
                          key={time}
                          value={time}
                          className="hover:bg-neutral-700 focus:bg-neutral-700"
                        >
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Number of tickets
                  </label>
                  <Select 
                    value={selectedTickets.toString()} 
                    onValueChange={(value) => setSelectedTickets(parseInt(value))}
                  >
                    <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:border-neutral-600 transition-colors">
                      <SelectValue placeholder="Select tickets">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-red-500" />
                          <span>
                            {selectedTickets}{" "}
                            {selectedTickets === 1 ? "ticket" : "tickets"}
                          </span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent 
                      className="bg-neutral-800 border-neutral-700 text-white max-h-[300px]"
                      position="popper"
                      sideOffset={4}
                    >
                      <div className="p-3 border-b border-neutral-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white/90">
                            Quick selection
                          </span>
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
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 mt-3">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <motion.div key={num} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <SelectItem
                                value={num.toString()}
                                className={cn(
                                  "h-9 rounded-md text-sm font-medium flex items-center justify-center cursor-pointer m-0 p-0 data-[highlighted]:bg-transparent",
                                  selectedTickets === num
                                    ? "bg-red-600 text-white hover:bg-red-600/90"
                                    : "bg-neutral-700 text-white hover:bg-neutral-600"
                                )}
                              >
                                <div className="flex items-center justify-center w-full h-full">
                                  {num}
                                </div>
                              </SelectItem>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="py-1 px-1 max-h-[200px] overflow-y-auto">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                          <SelectItem
                            key={num}
                            value={num.toString()}
                            className={cn(
                              "cursor-pointer transition-colors",
                              selectedTickets === num && "bg-neutral-700"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{num} {num === 1 ? "ticket" : "tickets"}</span>
                              {ticket.price && (
                                <span className="text-sm text-gray-400">
                                  {ticket.price.currency}{(ticket.price.amount * num).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Price per ticket</span>
                  <span className="text-white">
                    {ticket.price?.currency}
                    {ticket.price?.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Quantity</span>
                  <motion.span
                    key={selectedTickets}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-white"
                  >
                    {selectedTickets}
                  </motion.span>
                </div>
                <div className="w-full h-px bg-[#333333] my-4"></div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">Total</span>
                  <motion.span
                    key={calculateTotal()}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="text-2xl font-bold"
                  >
                    {ticket.price?.currency}
                    {calculateTotal().toLocaleString()}
                  </motion.span>
                </div>
                <span className="text-xs text-gray-400 block text-right">
                  (excl. taxes)
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "#ff3b30" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="w-full py-4 mt-6 bg-gradient-to-r from-[#e30613] to-[#ff4d38] text-white text-lg font-medium rounded-xl shadow-lg hover:shadow-red-500/20"
            >
              Purchase Now
            </motion.button>

            <p className="text-center text-xs text-gray-500 mt-4">
              By clicking purchase, you agree to our terms & conditions
            </p>
          </div>
        </div>
      </div>
      <LatestUploads shows={latestShows} className="bg-[#0f0f0f]" />
    </div>
  );
}
