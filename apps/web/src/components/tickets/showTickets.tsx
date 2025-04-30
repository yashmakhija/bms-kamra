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
  ArrowUpRight,
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
    window.location.href = `/shows/${show.id}`;
  };

  return (
    <div className="group cursor-pointer w-full bg-[#1D1D1D] rounded-[32px] p-6 text-white flex flex-col">
      {/* Title and Description */}
      <div className="space-y-3 mb-8">
        <h2 className="text-[28px] font-semibold text-white leading-tight">
          {show.title}
        </h2>
        <p className="text-neutral-400 text-lg leading-relaxed line-clamp-2">
          Watch Kunal perform at Dubai's biggest venue. This comic special...
        </p>
      </div>

      {/* Event Details - Vertical Stack */}
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="text-[#f2f900]">
            <Calendar size={10} strokeWidth={1.5} />
          </div>
          <p className="text-[18px] text-white">{show.date}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[#f2f900]">
            <Timer size={10} strokeWidth={1.5} />
          </div>
          <p className="text-[18px] text-white">{show.duration}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[#f2f900]">
            <Clock size={10} strokeWidth={1.5} />
          </div>
          <p className="text-[18px] text-white">{show.time}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[#f2f900] outline-offset-[-0.88px] absolute outline w-4 h-5 left-[3.50px] top-[2px]">
            <MapPin size={10} strokeWidth={1.5} />
          </div>
          <p className="text-[18px] text-white">{show.venue}</p>
        </div>
      </div>

      {/* Price and Action Section */}
      <div className="mt-auto pt-6">
        <div className="bg-[#2E2E2E] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[#F2F900] text-2xl font-bold">
              ₹{show.price.amount.toLocaleString()}
            </p>
            <p className="text-[#F1F1F1] text-sm">onwards</p>
          </div>

          <button
            onClick={handleBookNow}
            className="bg-[#F2F900] cursor-pointer w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:bg-[#F2F900]/90"
          >
            <ArrowUpRight className="w-6 h-6 text-black" />
          </button>
        </div>
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
    <section className={cn("w-full bg-[#111111]", className)}>
      <div className="container mx-auto px-4 md:px-8 lg:px-30">
        {/* Filter Section */}
        <div className="mb-8 mt-8">
          {/* Small Screen: Horizontal Scrollable Filters */}
          <div className="flex md:hidden overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar">
            <div className="flex-shrink-0 min-w-[260px] snap-start">
              <FilterButton
                label="Date"
                options={dateOptions}
                onSelect={setSelectedDate}
              />
            </div>
            <div className="flex-shrink-0 min-w-[260px] snap-start">
              <FilterButton
                label="Duration"
                options={durationOptions}
                onSelect={setSelectedDuration}
              />
            </div>
            <div className="flex-shrink-0 min-w-[260px] snap-start">
              <FilterButton
                label="Location"
                options={locationOptions}
                onSelect={setSelectedLocation}
              />
            </div>
            <div className="flex-shrink-0 min-w-[260px] snap-start">
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

        {/* Mobile & Tablet View: Horizontal Scrolling */}
        <div className="xl:hidden">
          <div
            className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory no-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {shows.map((show) => (
              <div
                key={show.id}
                className="flex-shrink-0 snap-start snap-always"
                style={{
                  width: "calc(100vw - 100px)",
                  maxWidth: "360px",
                  minWidth: "300px",
                }}
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

        {/* Desktop View: Grid */}
        <div className="hidden xl:block">
          <div className="grid grid-cols-3 mb-8 gap-6">
            {shows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                isSelected={selectedShowId === show.id}
                isLoading={isLoading && selectedShowId === show.id}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
