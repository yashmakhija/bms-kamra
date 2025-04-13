"use client";

import { useRef, useEffect } from "react";
import { ShowCard } from "../show-card";
import { cn } from "@repo/ui/utils";
import { create } from "zustand";

interface LatestShow {
  id: string;
  title: string;
  image: string;
}

interface ScrollState {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  setScrollState: (left: boolean, right: boolean) => void;
}

const useScrollStore = create<ScrollState>((set) => ({
  canScrollLeft: false,
  canScrollRight: true,
  setScrollState: (left, right) =>
    set({ canScrollLeft: left, canScrollRight: right }),
}));

interface LatestUploadsProps {
  shows: LatestShow[];
  className?: string;
}

export function LatestUploads({ shows, className }: LatestUploadsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { setScrollState } = useScrollStore();

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setScrollState(scrollLeft > 0, scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => scrollContainer.removeEventListener("scroll", checkScroll);
    }
  }, []);

  return (
    <section className={cn("w-full py-12 bg-[#171717]", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-white text-4xl font-bold leading-tight mb-8 tracking-wide">
          Latest Uploads
        </h2>

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
                  title={show.title}
                  image={show.image}
                  onClick={() => console.log("Show clicked:", show.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-3 gap-6">
          {shows.map((show) => (
            <ShowCard
              key={show.id}
              title={show.title}
              image={show.image}
              onClick={() => console.log("Show clicked:", show.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
