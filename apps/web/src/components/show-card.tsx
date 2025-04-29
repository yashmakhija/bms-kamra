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
  link?: string;
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
  link,
  onClick,
  ...props
}: ShowCardProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (link) {
      e.stopPropagation();
      window.open(link, "_blank", "noopener,noreferrer");
    } else if (onClick) {
      onClick(e as any);
    }
  };

  return (
    <div
      className={cn("group cursor-pointer", className)}
      onClick={handleClick}
      {...props}
    >
      <div className="bg-[#1D1D1D] rounded-[32px] p-4 flex flex-col">
        <div className="relative w-full rounded-[24px] overflow-hidden mb-4">
          <img
            src={image}
            alt={title}
            className="self-stretch relative rounded-[20px] h-full object-cover"
          />
        </div>

        {/* Text Container */}
        <div className="bg-[#2E2E2E] self-stretch  p-3  rounded-2xl inline-flex justify-start items-start gap-2.5 ">
          <p className="text-base font-medium leading-snug text-white">
            {title}
          </p>
        </div>
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
