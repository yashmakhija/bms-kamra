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
  ArrowUpRight,
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
    window.location.href = `/shows/${show.id}`;
  };

  return (
    <div className="bg-[#1D1D1D] w-90 rounded-[32px] p-6 text-white flex flex-col">
      {/* Title and Description */}
      <div className="space-y-3 mb-8">
        <h2 className="text-lg self-stretch font-bold text-[#f1f1f1] leading-relaxed">
          {show.title}
        </h2>
        <p className="text-[#f1f1f1]/70 justify-center  text-sm font-normal leading-tight line-clamp-2">
          {show.description}
        </p>
      </div>

      {/* Event Details - Vertical Stack */}
      <div className="space-y-5 self-stretch ">
        <div className="flex items-center gap-4">
          <div className="text-[#F2F900]">
            <Calendar size={20} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white">{show.date}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[#F2F900]">
            <Timer size={20} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white">{show.duration}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[#F2F900]">
            <Clock size={20} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white">{show.time}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[#F2F900]">
            <MapPin size={20} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white">{show.venue}</p>
        </div>
      </div>

      {/* Price and Action Section */}
      <div className="mt-auto pt-6">
        <div className="bg-[#2e2e2e] rounded-3xl border-t border-[#04021b]/10 p-4 flex items-start justify-between">
          <div>
            <p className="text-[#F2F900] text-2xl font-bold leading-normal justify-center">
              ₹{show.price.amount.toLocaleString()}
            </p>
            <p className="text-[#F1F1F1] text-xs font-normal leading-none">
              onwards
            </p>
          </div>

          <button
            onClick={handleBookNow}
            className="bg-[#f2f900] cursor-pointer w-11 self-stretch p-2 h-12 rounded-[64px] inline-flex justify-center items-center gap-2.5 transition-colors"
          >
            <ArrowUpRight className="w-6 h-6 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface UpcomingShowsProps {
  shows?: Show[];
  className?: string;
  title?: string;
  limit?: number;
  removeButton?: boolean;
  excludeShowId?: string;
  removeArrow?: boolean;
}

export function UpcomingShows({
  shows: propShows,
  className,
  title,
  limit = 6,
  removeButton = false,
  excludeShowId,
  removeArrow = false,
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

  // Filter out excluded show and apply limit
  const filteredShows = excludeShowId
    ? shows.filter((show) => show.id !== excludeShowId)
    : shows;

  // Apply limit to shows
  const limitedShows = limit ? filteredShows.slice(0, limit) : filteredShows;

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

  // No shows state
  if (shows.length === 0) {
    return (
      <section
        className={cn("w-full py-24 bg-[#111111] text-center", className)}
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
        <div className="flex justify-between items-center mb-8">
          <div
            className={cn(
              "font-bold leading-10",
              title === "Tickets" || title === "Similar Shows"
                ? "text-[#F2F900] text-4xl"
                : "text-white text-3xl"
            )}
          >
            {title}
          </div>

          {/* Only show browse all button when removeButton is false */}
          {!removeButton && (
            <div className="hidden md:block">
              <Button className="bg-neutral-50 text-neutral-900 text-sm leading-none font-medium inline-flex justify-center rounded-[32px] gap-2 overflow-hidden min-w-[110px] h-[40px] px-6 py-2">
                <a href="/tickets">Browse all</a>
              </Button>
            </div>
          )}

          <div className="md:hidden">
            {removeButton ? (
              removeArrow ? null : (
                <Button className=" bg-neutral-50 text-neutral-900 rounded-xl w-12 h-12 p-0 flex items-center justify-center">
                  <ArrowRight size={20} />
                </Button>
              )
            ) : (
              <Button className="bg-white hover:bg-white/90 text-black rounded-full w-10 h-10 p-0 flex items-center justify-center">
                <a href="/tickets">
                  <ArrowRight size={20} />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Horizontal Scrolling for All Screen Sizes */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scroll-pl-6"
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
                width: "min(calc(100vw - 100px), 360px)",
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
    </section>
  );
}
