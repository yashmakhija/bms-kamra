"use client";

import { useRef, useEffect } from "react";
import { Show, useShowsStore } from "../../store/shows";
import { Calendar, Clock, Timer, MapPin } from "lucide-react";
import { cn } from "@repo/ui/utils";
import { useNavigate } from "react-router-dom";

// Reusable Components
interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#e31001] mt-1">{icon}</div>
      <div>
        <p className="text-neutral-400 text-[10px] font-normal leading-3">
          {label}
        </p>
        <p className="text-neutral-100 text-sm font-normal leading-none mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

interface ShowCardProps {
  show: Show;
  onClick: () => void;
  isSelected: boolean;
  isLoading: boolean;
}

function ShowCard({ show, onClick, isSelected, isLoading }: ShowCardProps) {
  return (
    <div
      className={cn(
        "relative bg-neutral-800 rounded-[20px] p-6 text-white",
        "w-full shrink-0 sm:min-w-[50vw] lg:min-w-[1vw]",
        "overflow-visible",
        isSelected && "border-2 border-[#e31001]"
      )}
      style={{
        cursor: isLoading ? "not-allowed" : "pointer",
      }}
      onClick={onClick}
    >
      <div className="space-y-8">
        <h2 className="text-xl text-neutral-100 font-semibold leading-snug">
          {show.title}
        </h2>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <InfoItem
            icon={<Calendar size={20} strokeWidth={1.5} />}
            label="Date"
            value={show.date}
          />
          <InfoItem
            icon={<Clock size={20} strokeWidth={1.5} />}
            label="Time"
            value={show.time}
          />
          <InfoItem
            icon={<Timer size={20} strokeWidth={1.5} />}
            label="Duration"
            value={show.duration}
          />
          <InfoItem
            icon={<MapPin size={20} strokeWidth={1.5} />}
            label="Venue"
            value={show.venue}
          />
        </div>

        <div className="relative">
          <div className="absolute left-[-24px] right-[-24px] h-1 flex items-center">
            {/* Left Edge Circle */}
            <div className="absolute left-0 -translate-y-1/2 -translate-x-1/2 w-8 h-6 bg-[#171717] rounded-full" />

            {/* Right Edge Circle */}
            <div className="absolute right-0 -translate-y-1/2 translate-x-1/2 w-8 h-6 bg-[#171717] rounded-full" />

            {/* Dotted Line */}
            <div className="w-full flex justify-between items-center px-6">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-[3px] mb-5 rounded-full bg-neutral-900",
                    i % 3 === 1 ? "w-4" : "w-2"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-2xl text-neutral-50 font-bold tracking-tight">
            {show.price.currency}
            {show.price.amount.toLocaleString()}
            <span className="text-xs text-neutral-400 font-normal ml-1">
              (excl. taxes)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

interface UpcomingShowsProps {
  shows: Show[];
  className?: string;
}

export function UpcomingShows({ shows, className }: UpcomingShowsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedShowId = useShowsStore((state) => state.selectedShowId);
  const isLoading = useShowsStore((state) => state.isLoading);
  const setShows = useShowsStore((state) => state.setShows);
  const selectShow = useShowsStore((state) => state.selectShow);
  const setLoading = useShowsStore((state) => state.setLoading);
  const getTicketIdFromShowId = useShowsStore(
    (state) => state.getTicketIdFromShowId
  );
  const navigate = useNavigate();

  useEffect(() => {
    setShows(shows);
  }, [shows, setShows]);

  const handleShowSelect = async (id: string) => {
    if (isLoading) return;
    setLoading(true);
    try {
      selectShow(id);
      // Get the corresponding ticket ID and navigate to it
      const ticketId = getTicketIdFromShowId(id);
      navigate(`/tickets/${ticketId}`);
    } catch (error) {
      console.error("Failed to select show:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={cn("w-full py-12 bg-[#171717]", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-white text-4xl font-bold leading-tight mb-8 tracking-wide">
          Upcoming Shows
        </h2>

        {/* Mobile/Tablet Scroll View */}
        <div className="lg:hidden -mx-4">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto px-4 pb-6 snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {shows.map((show) => (
              <div key={show.id} className="snap-start snap-always w-full">
                <ShowCard
                  show={show}
                  onClick={() => handleShowSelect(show.id)}
                  isSelected={selectedShowId === show.id}
                  isLoading={isLoading && selectedShowId === show.id}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden lg:grid grid-cols-3 gap-8">
          {shows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              onClick={() => handleShowSelect(show.id)}
              isSelected={selectedShowId === show.id}
              isLoading={isLoading && selectedShowId === show.id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
