import * as React from "react";
import { cn } from "../../utils";
import { Calendar, Clock, Timer, MapPin } from "lucide-react";

interface ShowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  image: string;
  year: string;
  className?: string;
  aspectRatio?: "portrait" | "square";
  width?: number;
  height?: number;
}

export function ShowCard({
  title,
  image,
  year,
  className,
  aspectRatio = "portrait",
  width,
  height,
  ...props
}: ShowCardProps) {
  return (
    <div className={cn("space-y-3 cursor-pointer group", className)} {...props}>
      <div className="overflow-hidden rounded-[20px] bg-neutral-800">
        <img
          src={image}
          alt={title}
          width={width}
          height={height}
          className={cn(
            "h-auto w-full object-cover transition-all duration-300 group-hover:scale-105",
            aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square"
          )}
        />
      </div>
      <div className="space-y-1 text-sm">
        <h3 className="font-medium leading-none text-white">{title}</h3>
        <p className="text-xs text-neutral-400">{year}</p>
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
        isLoading && "opacity-70 pointer-events-none",
        className
      )}
      {...props}
    >
      <div className="space-y-8">
        <h2 className="text-[22px] text-neutral-100 font-semibold leading-snug">
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
            <span className="text-xs text-neutral-100 font-normal mt-0.5 leading-none ml-1">
              (excl. taxes)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
