import * as React from "react";
import { cn } from "@repo/ui/utils";
import { Calendar, Clock, Timer, MapPin } from "lucide-react";

interface ShowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  image: string;
  thumbnailTitle?: string;
  artist?: string;
  type?: string;
  className?: string;
  aspectRatio?: "portrait" | "square";
  width?: number;
  height?: number;
}

export function ShowCard({
  title,
  image,
  thumbnailTitle,
  artist,
  type,
  className,
  aspectRatio = "portrait",
  width,
  height,
  ...props
}: ShowCardProps) {
  return (
    <div
      className={cn(
        "relative group w-full shrink-0 cursor-pointer px-2",
        "sm:min-w-[75vw] md:min-w-[300px] md:w-full md:px-0", // Adjusted width for better mobile view
        className
      )}
      {...props}
    >
      <div className="overflow-hidden rounded-xl bg-neutral-800 aspect-video max-w-[500px] mx-auto">
        <img
          src={image}
          alt={title}
          width={width || 400}
          height={height || 225}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-3 space-y-1 max-w-[500px] mx-auto">
        <h3 className="font-medium text-neutral-50 text-base sm:text-lg md:text-lg leading-tight line-clamp-2">
          {title}
        </h3>
        {artist && (
          <p className="text-neutral-400 text-sm md:text-sm line-clamp-1">
            {artist}
          </p>
        )}
      </div>
    </div>
  );
}

interface ShowInfoProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function ShowInfo({ icon, label, value }: ShowInfoProps) {
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

interface ShowDetailsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  date: string;
  time: string;
  duration: string;
  venue: string;
  price: {
    currency: string;
    amount: number;
  };
  isSelected?: boolean;
  isLoading?: boolean;
}

export function ShowDetailsCard({
  title,
  date,
  time,
  duration,
  venue,
  price,
  isSelected,
  isLoading,
  className,
  ...props
}: ShowDetailsCardProps) {
  return (
    <div
      className={cn(
        "relative bg-neutral-800 rounded-[20px] p-6 text-white overflow-hidden",
        isSelected && "border-2 border-[#e31001]",
        className
      )}
      style={{
        cursor: isLoading ? "not-allowed" : "pointer",
      }}
      {...props}
    >
      <div className="space-y-8">
        <h2 className="text-[22px] text-neutral-100 font-semibold text-base leading-snug">
          {title}
        </h2>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <ShowInfo
            icon={<Calendar size={20} strokeWidth={1.5} />}
            label="Date"
            value={date}
          />
          <ShowInfo
            icon={<Clock size={20} strokeWidth={1.5} />}
            label="Time"
            value={time}
          />
          <ShowInfo
            icon={<Timer size={20} strokeWidth={1.5} />}
            label="Duration"
            value={duration}
          />
          <ShowInfo
            icon={<MapPin size={20} strokeWidth={1.5} />}
            label="Venue"
            value={venue}
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
            {price.currency}
            {price.amount.toLocaleString()}
            <span className="text-xs text-neutral-100 font-normal mt-0.5 leading-none">
              (excl. taxes)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
