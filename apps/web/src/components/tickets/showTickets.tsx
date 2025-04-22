"use client";

import { useRef, useEffect, useState } from "react";
import { Show, useShowsStore } from "../../store/shows";
import {
  Calendar,
  Clock,
  Timer,
  MapPin,
  AlertCircle,
  Loader2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@repo/ui/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";

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

interface ShowCardProps {
  show: Show;
  onClick?: () => void;
  isSelected?: boolean;
  isLoading?: boolean;
}

function ShowCard({ show, onClick, isSelected, isLoading }: ShowCardProps) {
  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to booking page
    window.location.href = `/shows/${show.id}`;
  };

  return (
    <div className="bg-neutral-800 rounded-[20px] p-6 text-white w-90 h-105 aspect-[1/1.4] flex flex-col">
      <div className="h-[4.5rem] flex items-start">
        <h2 className="text-lg text-white font-bold line-clamp-3 leading-tight">
          {show.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-y-5 flex-grow mt-3">
        <InfoItem
          icon={<Calendar size={20} strokeWidth={1.5} />}
          label="Date"
          value={show.date}
        />
        <InfoItem
          icon={<Timer size={20} strokeWidth={1.5} />}
          label="Duration"
          value={show.duration}
        />
        <InfoItem
          icon={<Clock size={20} strokeWidth={1.5} />}
          label="Time"
          value={show.time}
        />
        <InfoItem
          icon={<MapPin size={20} strokeWidth={1.5} />}
          label="Venue"
          value={show.venue}
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
        <div className="flex flex-col">
          <p className="text-2xl text-neutral-50 font-bold leading-normal">
            ₹{show.price.amount.toLocaleString()}
          </p>
          <p className="text-[10px] font-normal text-neutral-400 leading-3">
            onwards
          </p>
        </div>

        <Button
          onClick={handleBookNow}
          className="inline-flex cursor-pointer items-center justify-center bg-[#e31001] hover:bg-[#D00000] text-neutral-50 text-sm leading-none font-medium rounded-xl gap-2 overflow-hidden min-w-[110px] h-[40px] px-6 py-3"
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  options: string[];
  onSelect: (value: string) => void;
}

function FilterButton({ label, options, onSelect }: FilterButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex justify-between items-center w-full bg-neutral-800 rounded-xl p-4 text-white">
        <span>{label}</span>
        <ChevronDown size={20} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-neutral-800 text-white border-neutral-700 rounded-xl min-w-[200px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            className="hover:bg-neutral-700 cursor-pointer"
            onClick={() => onSelect(option)}
          >
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ShowTicketsProps {
  shows?: Show[];
  className?: string;
}

export function ShowTickets({ shows: propShows, className }: ShowTicketsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter states
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Mock filter options - replace with real data when available
  const priceOptions = [
    "All Prices",
    "Under ₹500",
    "₹500 - ₹1000",
    "₹1000 - ₹2000",
    "Above ₹2000",
  ];
  const locationOptions = [
    "All Locations",
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Pune",
  ];
  const durationOptions = [
    "All Durations",
    "1 hour",
    "1.5 hours",
    "2 hours",
    "2+ hours",
  ];
  const dateOptions = [
    "Any Date",
    "Today",
    "This Weekend",
    "This Month",
    "Next Month",
  ];

  // Get state and actions from store
  const {
    shows: storeShows,
    selectedShowId,
    isLoading,
    isError,
    errorMessage,
    fetchShows,
    selectShow,
    setLoading,
    getTicketIdFromShowId,
  } = useShowsStore();

  // Use API shows if no props were passed
  const shows = propShows || storeShows;

  // Fetch shows from API on component mount
  useEffect(() => {
    if (!propShows) {
      fetchShows();
    }
  }, [fetchShows, propShows]);

  const handleShowSelect = async (id: string) => {
    if (isLoading) return;
    setLoading(true);
    try {
      selectShow(id);
      // Navigate directly to the show page using the show ID
      navigate(`/shows/${id}`);
    } catch (error) {
      console.error("Failed to select show:", error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isLoading && shows.length === 0) {
    return (
      <section
        className={cn("w-full py-24 bg-[#171717] text-center", className)}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#e31001] animate-spin mb-4" />
            <p className="text-white text-lg">Loading upcoming shows...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (isError) {
    return (
      <section
        className={cn("w-full py-24 bg-[#171717] text-center", className)}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 text-[#e31001] mb-4" />
            <p className="text-white text-lg">
              {errorMessage || "Failed to load shows. Please try again later."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // No shows state
  if (shows.length === 0) {
    return (
      <section
        className={cn("w-full py-24 bg-[#171717] text-center", className)}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 text-[#e31001] mb-4" />
            <p className="text-white text-lg">
              No upcoming shows at the moment. Check back later!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full bg-[#171717]", className)}>
      <div className="container mx-auto px-4 md:px-8 lg:px-30">
        {/* Filter Section */}
        <div className="mb-8 mt-8">
          {/* Small Screen: Horizontal Scrollable Filters */}
          <div
            className="flex md:hidden overflow-x-auto gap-4 pb-2 snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              direction: "rtl", // Right to left scrolling
            }}
          >
            <div
              className="flex-shrink-0 min-w-[260px] snap-start"
              style={{ direction: "ltr" }}
            >
              <FilterButton
                label="Date"
                options={dateOptions}
                onSelect={setSelectedDate}
              />
            </div>
            <div
              className="flex-shrink-0 min-w-[260px] snap-start"
              style={{ direction: "ltr" }}
            >
              <FilterButton
                label="Duration"
                options={durationOptions}
                onSelect={setSelectedDuration}
              />
            </div>
            <div
              className="flex-shrink-0 min-w-[260px] snap-start"
              style={{ direction: "ltr" }}
            >
              <FilterButton
                label="Location"
                options={locationOptions}
                onSelect={setSelectedLocation}
              />
            </div>
            <div
              className="flex-shrink-0 min-w-[260px] snap-start"
              style={{ direction: "ltr" }}
            >
              <FilterButton
                label="Price"
                options={priceOptions}
                onSelect={setSelectedPrice}
              />
            </div>
          </div>

          {/* Medium-Large Screen: Grid Filters */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterButton
              label="Price"
              options={priceOptions}
              onSelect={setSelectedPrice}
            />
            <FilterButton
              label="Location"
              options={locationOptions}
              onSelect={setSelectedLocation}
            />
            <FilterButton
              label="Duration"
              options={durationOptions}
              onSelect={setSelectedDuration}
            />
            <FilterButton
              label="Date"
              options={dateOptions}
              onSelect={setSelectedDate}
            />
          </div>
        </div>

        {/* Mobile, Tablet & Desktop Views: Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1 md:gap-12 lg:gap-22">
          {shows.map((show) => (
            <div
              key={show.id}
              className="w-full max-w-[420px] mx-auto md:max-w-none mb-12"
            >
              <ShowCard
                show={show}
                isSelected={selectedShowId === show.id}
                isLoading={isLoading && selectedShowId === show.id}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
