"use client";

import { useRef, useEffect, useState } from "react";
import { Show as StoreShow, useShowsStore } from "../../store/shows";
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

// Extended Show interface with category
interface Show extends StoreShow {
  category?: string;
}

// Ticket Card Component - Matches design in screenshots
function ShowCard({ show }: { show: Show }) {
  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/shows/${show.id}`;
  };

  return (
    <div className="bg-[#1D1D1D] w-full rounded-[32px] p-6 text-white flex flex-col h-full">
      {/* Title and Description */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl self-stretch font-bold text-white leading-tight line-clamp-2">
          {show.title || "Desh Ke Buddhe | Stand-Up Comedy by Kunal Kamra"}
        </h2>
        <p className="text-gray-400 text-sm font-normal leading-tight line-clamp-2">
          {show.description ||
            "Watch Kunal perform at Dubai's biggest venue. This comic special..."}
        </p>
      </div>

      {/* Event Details - Vertical Stack with yellow icons */}
      <div className="space-y-4 self-stretch">
        <div className="flex items-center gap-3">
          <div className="text-[#F2F900]">
            <Calendar size={16} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white">{show.date || "26 Jan 2026"}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[#F2F900]">
            <Timer size={16} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white">{show.duration || "90 mins"}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[#F2F900]">
            <Clock size={16} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white">{show.time || "8:00 PM"}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[#F2F900]">
            <MapPin size={16} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white">
            {show.venue || "Emirates Theatre, Dubai"}
          </p>
        </div>
      </div>

      {/* Price and Action Section */}
      <div className="mt-auto pt-6">
        <div className="bg-[#2A2A2A] rounded-3xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[#F2F900] text-2xl font-bold leading-none">
              ₹{show.price?.amount?.toLocaleString() || "3,999"}
            </p>
            <p className="text-white text-xs font-normal mt-1">onwards</p>
          </div>

          <button
            onClick={handleBookNow}
            className="bg-[#F2F900] cursor-pointer w-10 h-10 rounded-full flex justify-center items-center"
          >
            <ArrowRight className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Filter Component
function FilterButton({
  label,
  options,
  onSelect,
  selectedValue,
}: {
  label: string;
  options: string[];
  onSelect: (value: string) => void;
  selectedValue: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex justify-between items-center w-full bg-[#1D1D1D] rounded-[32px] py-3 px-5 text-white text-sm">
        <span>{selectedValue || label}</span>
        <ChevronDown size={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#1D1D1D] text-white border-[#2D2D2D] rounded-xl min-w-[200px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            className="hover:bg-[#2D2D2D] cursor-pointer text-sm"
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
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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
    "Dubai",
  ];
  const durationOptions = [
    "All Durations",
    "60 mins",
    "90 mins",
    "120 mins",
    "150+ mins",
  ];
  const dateOptions = [
    "Any Date",
    "Today",
    "This Weekend",
    "This Month",
    "Next Month",
  ];
  const categoryOptions = [
    "All Categories",
    "Comedy",
    "Music",
    "Theatre",
    "Sports",
    "Conference",
  ];

  // Get state and actions from store
  const {
    shows: storeShows,
    isLoading,
    isError,
    errorMessage,
    fetchShows,
  } = useShowsStore();

  // Use API shows if no props were passed
  const shows = propShows || storeShows;

  // Filter the shows based on selected filters
  const getFilteredShows = () => {
    let filtered = [...shows];

    // Filter by price
    if (selectedPrice && selectedPrice !== "All Prices") {
      filtered = filtered.filter((show) => {
        const price = show.price?.amount || 0;
        switch (selectedPrice) {
          case "Under ₹500":
            return price < 500;
          case "₹500 - ₹1000":
            return price >= 500 && price <= 1000;
          case "₹1000 - ₹2000":
            return price > 1000 && price <= 2000;
          case "Above ₹2000":
            return price > 2000;
          default:
            return true;
        }
      });
    }

    // Filter by location
    if (selectedLocation && selectedLocation !== "All Locations") {
      filtered = filtered.filter((show) => {
        return show.venue?.includes(selectedLocation);
      });
    }

    // Filter by duration
    if (selectedDuration && selectedDuration !== "All Durations") {
      filtered = filtered.filter((show) => {
        return show.duration === selectedDuration;
      });
    }

    // Filter by date
    if (selectedDate && selectedDate !== "Any Date") {
      const currentDate = new Date();
      const showDate = new Date();

      filtered = filtered.filter((show) => {
        if (!show.date) return true;

        const eventDate = new Date(show.date);

        switch (selectedDate) {
          case "Today":
            return eventDate.toDateString() === currentDate.toDateString();
          case "This Weekend":
            const saturday = new Date(currentDate);
            saturday.setDate(
              currentDate.getDate() + (6 - currentDate.getDay())
            );
            const sunday = new Date(saturday);
            sunday.setDate(saturday.getDate() + 1);
            return eventDate >= saturday && eventDate <= sunday;
          case "This Month":
            return (
              eventDate.getMonth() === currentDate.getMonth() &&
              eventDate.getFullYear() === currentDate.getFullYear()
            );
          case "Next Month":
            const nextMonth = new Date(currentDate);
            nextMonth.setMonth(currentDate.getMonth() + 1);
            return (
              eventDate.getMonth() === nextMonth.getMonth() &&
              eventDate.getFullYear() === nextMonth.getFullYear()
            );
          default:
            return true;
        }
      });
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "All Categories") {
      filtered = filtered.filter((show) => {
        return show.category === selectedCategory;
      });
    }

    return filtered;
  };

  // Fetch shows from API on component mount
  useEffect(() => {
    if (!propShows) {
      fetchShows();
    }
  }, [fetchShows, propShows]);

  // Mock shows data if needed or if there are no shows after filtering
  const mockShows = Array(9).fill({
    id: "1",
    title: "Desh Ke Buddhe | Stand-Up Comedy by Kunal Kamra",
    description:
      "Watch Kunal perform at Dubai's biggest venue. This comic special...",
    date: "26 Jan 2026",
    time: "8:00 PM",
    duration: "90 mins",
    venue: "Emirates Theatre, Dubai",
    price: { amount: 3999, currency: "INR" },
    category: "Comedy",
  });

  // Get filtered shows
  const filteredShows = getFilteredShows();
  const displayShows =
    filteredShows.length > 0
      ? filteredShows
      : shows.length > 0
        ? shows
        : mockShows;

  // Loading state
  if (isLoading && shows.length === 0) {
    return (
      <section
        className={cn("w-full py-24 bg-[#111111] text-center", className)}
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
        className={cn("w-full py-24 bg-[#111111] text-center", className)}
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

  // No results state after filtering
  if (filteredShows.length === 0 && shows.length > 0) {
    return (
      <section className={cn("w-full bg-[#111111] min-h-screen", className)}>
        <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-24 py-8">
          {/* Title Section */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-[#F2F900] text-4xl font-bold leading-10">
              Tickets
            </div>
          </div>

          {/* Medium Device - Top Horizontal Scrollable Filters */}
          <div className="hidden md:flex lg:hidden overflow-hidden gap-3 pb-6 mb-6 no-scrollbar">
            <div className="flex-shrink-0 min-w-[170px]">
              <FilterButton
                label="Price"
                options={priceOptions}
                onSelect={setSelectedPrice}
                selectedValue={selectedPrice}
              />
            </div>
            <div className="flex-shrink-0 min-w-[170px]">
              <FilterButton
                label="Location"
                options={locationOptions}
                onSelect={setSelectedLocation}
                selectedValue={selectedLocation}
              />
            </div>
            <div className="flex-shrink-0 min-w-[170px]">
              <FilterButton
                label="Duration"
                options={durationOptions}
                onSelect={setSelectedDuration}
                selectedValue={selectedDuration}
              />
            </div>
            <div className="flex-shrink-0 min-w-[170px]">
              <FilterButton
                label="Date"
                options={dateOptions}
                onSelect={setSelectedDate}
                selectedValue={selectedDate}
              />
            </div>
            <div className="flex-shrink-0 min-w-[170px]">
              <FilterButton
                label="Category"
                options={categoryOptions}
                onSelect={setSelectedCategory}
                selectedValue={selectedCategory}
              />
            </div>
          </div>

          {/* Mobile Filters - Show only two main filters */}
          <div className="md:hidden flex gap-3 pb-6 mb-6">
            <div className="flex-1">
              <FilterButton
                label="Location"
                options={locationOptions}
                onSelect={setSelectedLocation}
                selectedValue={selectedLocation}
              />
            </div>
            <div className="flex-1">
              <FilterButton
                label="Duration"
                options={durationOptions}
                onSelect={setSelectedDuration}
                selectedValue={selectedDuration}
              />
            </div>
          </div>

          {/* No Results Message */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-[#e31001] mb-4" />
            <p className="text-white text-lg mb-4">
              No shows match your selected filters
            </p>
            <Button
              className="bg-[#F2F900] text-black rounded-full px-6 py-2 hover:bg-[#F2F900]/90"
              onClick={() => {
                setSelectedPrice("");
                setSelectedLocation("");
                setSelectedDuration("");
                setSelectedDate("");
                setSelectedCategory("");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Main render - Shows with Filters
  return (
    <section className={cn("w-full bg-[#111111] min-h-screen", className)}>
      <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        {/* Medium Device - Top Horizontal Scrollable Filters */}
        <div className="hidden md:flex lg:hidden overflow-hidden gap-3 pb-6 mb-6 no-scrollbar">
          <div className="flex-shrink-0 min-w-[170px]">
            <FilterButton
              label="Price"
              options={priceOptions}
              onSelect={setSelectedPrice}
              selectedValue={selectedPrice}
            />
          </div>
          <div className="flex-shrink-0 min-w-[170px]">
            <FilterButton
              label="Location"
              options={locationOptions}
              onSelect={setSelectedLocation}
              selectedValue={selectedLocation}
            />
          </div>
          <div className="flex-shrink-0 min-w-[170px]">
            <FilterButton
              label="Duration"
              options={durationOptions}
              onSelect={setSelectedDuration}
              selectedValue={selectedDuration}
            />
          </div>
          <div className="flex-shrink-0 min-w-[170px]">
            <FilterButton
              label="Date"
              options={dateOptions}
              onSelect={setSelectedDate}
              selectedValue={selectedDate}
            />
          </div>
          <div className="flex-shrink-0 min-w-[170px]">
            <FilterButton
              label="Category"
              options={categoryOptions}
              onSelect={setSelectedCategory}
              selectedValue={selectedCategory}
            />
          </div>
        </div>

        {/* Mobile Filters - Show only two main filters */}
        <div className="md:hidden flex gap-3 pb-6 mb-6">
          <div className="flex-1">
            <FilterButton
              label="Location"
              options={locationOptions}
              onSelect={setSelectedLocation}
              selectedValue={selectedLocation}
            />
          </div>
          <div className="flex-1">
            <FilterButton
              label="Duration"
              options={durationOptions}
              onSelect={setSelectedDuration}
              selectedValue={selectedDuration}
            />
          </div>
        </div>

        {/* Main Content Area with Sidebar for Desktop */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop Only */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <h2 className="text-white text-xl font-bold mb-6">Filters</h2>
            <div className="space-y-4">
              <div>
                <FilterButton
                  label="Price"
                  options={priceOptions}
                  onSelect={setSelectedPrice}
                  selectedValue={selectedPrice}
                />
              </div>
              <div>
                <FilterButton
                  label="Location"
                  options={locationOptions}
                  onSelect={setSelectedLocation}
                  selectedValue={selectedLocation}
                />
              </div>
              <div>
                <FilterButton
                  label="Duration"
                  options={durationOptions}
                  onSelect={setSelectedDuration}
                  selectedValue={selectedDuration}
                />
              </div>
              <div>
                <FilterButton
                  label="Date"
                  options={dateOptions}
                  onSelect={setSelectedDate}
                  selectedValue={selectedDate}
                />
              </div>
              <div>
                <FilterButton
                  label="Category"
                  options={categoryOptions}
                  onSelect={setSelectedCategory}
                  selectedValue={selectedCategory}
                />
              </div>
              {/* Clear Filters Button - Only shown when filters are applied */}
              {(selectedPrice ||
                selectedLocation ||
                selectedDuration ||
                selectedDate ||
                selectedCategory) && (
                <div className="pt-4">
                  <Button
                    className="w-full bg-[#F2F900] text-black rounded-full px-4 py-2 hover:bg-[#F2F900]/90"
                    onClick={() => {
                      setSelectedPrice("");
                      setSelectedLocation("");
                      setSelectedDuration("");
                      setSelectedDate("");
                      setSelectedCategory("");
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Shows Content Area */}
          <div className="flex-1">
            <div className="flex justify-center lg:justify-between items-center mb-8">
              <div className="text-white text-4xl font-bold leading-10">
                Tickets
              </div>
            </div>
            {/* Grid Layout for Medium & Large Devices */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
              {displayShows.map((show, index) => (
                <div key={`${show.id}-${index}`} className="h-full">
                  <ShowCard show={show} />
                </div>
              ))}
            </div>

            {/* Single Column for Mobile */}
            <div className="md:hidden space-y-6">
              {displayShows.map((show, index) => (
                <div key={`${show.id}-${index}`}>
                  <ShowCard show={show} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
