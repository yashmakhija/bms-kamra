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
} from "lucide-react";
import { cn } from "@repo/ui/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";

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

interface UpcomingShowsProps {
  shows?: Show[];
  className?: string;
  title?: string;
  limit?: number;
}

export function UpcomingShows({
  shows: propShows,
  className,
  title,
  limit = 6,
}: UpcomingShowsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  // Apply limit to shows
  const limitedShows = limit ? shows.slice(0, limit) : shows;

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
        <div className="flex justify-between items-center mb-8">
          <div className="text-white text-3xl font-bold leading-10">
            {title}
          </div>

          <div className="sm:hidden md:block">
            <Button className="bg-neutral-50 text-neutral-900 text-sm leading-none font-medium rounded-xl gap-2 overflow-hidden min-w-[110px] h-[40px] px-6 py-4">
              <a href="/tickets">Browse all</a>
            </Button>
          </div>

          <div className="md:hidden">
            <Button className="bg-neutral-50 text-neutral-900 rounded-xl w-12 h-12 p-0 flex items-center justify-center">
              <ArrowRight size={20} />
            </Button>
          </div>
        </div>

        {/* Mobile & Tablet View: Horizontal Scrolling */}
        <div className="xl:hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {limitedShows.map((show) => (
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

        {/* Desktop View: 3-Column Grid */}
        <div className="hidden xl:block">
          <div className="grid grid-cols-3 gap-19">
            {limitedShows.map((show) => (
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
