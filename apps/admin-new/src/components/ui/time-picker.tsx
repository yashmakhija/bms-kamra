"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Label } from "@repo/ui/components/ui/label";
import { Input } from "@repo/ui/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/utils";

interface TimePickerDemoProps {
  time: string;
  setTime: (time: string) => void;
  className?: string;
}

export function TimePickerDemo({
  time,
  setTime,
  className,
}: TimePickerDemoProps) {
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [open, setOpen] = useState(false);

  // Parse the time string when it changes from parent
  useEffect(() => {
    if (!time) return;

    try {
      // Handle 24-hour format (like "14:30")
      if (time.includes(":")) {
        const [hourStr, minuteStr] = time.split(":");
        const hourNum = parseInt(hourStr, 10);

        if (hourNum > 12) {
          setHours(String(hourNum - 12).padStart(2, "0"));
          setPeriod("PM");
        } else if (hourNum === 12) {
          setHours("12");
          setPeriod("PM");
        } else if (hourNum === 0) {
          setHours("12");
          setPeriod("AM");
        } else {
          setHours(String(hourNum).padStart(2, "0"));
          setPeriod(hourNum === 12 ? "PM" : "AM");
        }

        setMinutes(minuteStr.substring(0, 2));
      }
    } catch (error) {
      console.error("Error parsing time:", error);
    }
  }, [time]);

  // Update the time when hours, minutes, or period changes
  useEffect(() => {
    if (hours && minutes) {
      let hoursNum = parseInt(hours, 10);

      // Convert to 24-hour format for storage
      if (period === "PM" && hoursNum < 12) {
        hoursNum += 12;
      } else if (period === "AM" && hoursNum === 12) {
        hoursNum = 0;
      }

      const formattedHours = String(hoursNum).padStart(2, "0");
      const formattedMinutes = String(parseInt(minutes, 10)).padStart(2, "0");

      const formattedTime = `${formattedHours}:${formattedMinutes}`;
      setTime(formattedTime);
    }
  }, [hours, minutes, period, setTime]);

  // Generate hours and minutes options
  const hoursOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: String(i + 1).padStart(2, "0"),
  }));

  const minutesOptions = Array.from({ length: 60 }, (_, i) => ({
    value: String(i).padStart(2, "0"),
    label: String(i).padStart(2, "0"),
  }));

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !time && "text-muted-foreground"
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {time ? (
              <span>
                {hours}:{minutes} {period}
              </span>
            ) : (
              <span>Select time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex gap-2">
            <div className="flex flex-col">
              <Label htmlFor="hours" className="mb-2 text-xs font-medium">
                Hours
              </Label>
              <Select value={hours} onValueChange={(value) => setHours(value)}>
                <SelectTrigger id="hours" className="w-16 border-zinc-300">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {hoursOptions.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="minutes" className="mb-2 text-xs font-medium">
                Minutes
              </Label>
              <Select
                value={minutes}
                onValueChange={(value) => setMinutes(value)}
              >
                <SelectTrigger id="minutes" className="w-16 border-zinc-300">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {minutesOptions.map((minute) => (
                    <SelectItem key={minute.value} value={minute.value}>
                      {minute.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="period" className="mb-2 text-xs font-medium">
                Period
              </Label>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as "AM" | "PM")}
              >
                <SelectTrigger id="period" className="w-16 border-zinc-300">
                  <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
