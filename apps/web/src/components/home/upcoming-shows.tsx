"use client";

import { useEffect } from "react";
import { Show, useShowsStore } from "../../store/shows";
import { Calendar, Clock, Timer, MapPin } from "lucide-react";
import { cn } from "@repo/ui/utils";

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
        <p className="text-neutral-100 text-xs font-normal leading-none mt-0.5">
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
        "relative bg-neutral-800 rounded-[20px] p-6 text-white overflow-hidden",
        isSelected && "border-2 border-[#e31001]"
      )}
      style={{
        cursor: isLoading ? "not-allowed" : "pointer",
      }}
      onClick={onClick}
    >
      <div className="space-y-8">
        <h2 className="text-[22px] text-neutral-100 font-semibold text-base leading-snug">
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
          <div className="absolute left-[-24px] right-[-24px] h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
          <div className="absolute left-[-24px] right-[-24px] flex justify-between px-6">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="w-1 h-[3px] bg-neutral-700" />
            ))}
          </div>
        </div>

        <div className="pt-2">
          <p className="text-2xl text-neutral-50 font-bold tracking-tight">
            {show.price.currency}
            {show.price.amount.toLocaleString()}
            <span className="text-xs text-neutral-100 font-normal mt-0.5 leading-none">
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
  const selectedShowId = useShowsStore(
    (state: { selectedShowId: string | null }) => state.selectedShowId
  );
  const isLoading = useShowsStore(
    (state: { isLoading: boolean }) => state.isLoading
  );
  const setShows = useShowsStore(
    (state: { setShows: (shows: Show[]) => void }) => state.setShows
  );
  const selectShow = useShowsStore(
    (state: { selectShow: (id: string) => void }) => state.selectShow
  );
  const setLoading = useShowsStore(
    (state: { setLoading: (loading: boolean) => void }) => state.setLoading
  );

  useEffect(() => {
    setShows(shows);
  }, [shows, setShows]);

  const handleShowSelect = async (id: string) => {
    setLoading(true);
    try {
      selectShow(id);
    } catch (error) {
      console.error("Failed to select show:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className={cn("w-full py-12 bg-[#171717]", className)}>
        <div className="container mx-auto px-4">
          <h2 className="text-white text-4xl font-bold leading-tight mb-8 tracking-wide">
            Upcoming Shows
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
    </>
  );
}
