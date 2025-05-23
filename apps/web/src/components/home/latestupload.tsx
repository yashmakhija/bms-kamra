"use client";

import { useRef, useEffect } from "react";
import { ShowCard } from "../show-card";
import { cn } from "@repo/ui/utils";
import { create } from "zustand";
import { ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

interface LatestShow {
  id: string;
  title: string;
  image: string;
  link: string;
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
  const limitedShows = shows.slice(0, 6);
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
    <section className={cn("w-full py-12 bg-[#111111]", className)}>
      <div className="container mx-auto px-4 md:px-8 lg:px-30">
        <div className="flex justify-between items-center mb-8">
          <div className="text-[#F2F900] text-4xl font-bold leading-10">
            Latest Uploads
          </div>

          <div className="hidden md:block">
            <Button className="bg-neutral-50 cursor-pointer text-neutral-900 text-sm leading-none font-medium rounded-full gap-2 overflow-hidden min-w-[110px] h-[40px] px-6 py-4">
              <a href="/latest-uploads">Browse all</a>
            </Button>
          </div>

          <div className="md:hidden">
            <a href="/latest-uploads">
              <ArrowRight size={20} />
            </a>
          </div>
        </div>

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
                  title={show.title}
                  image={show.image}
                  link={show.link}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden xl:block">
          <div className="grid grid-cols-3 gap-19">
            {limitedShows.map((show) => (
              <ShowCard
                key={show.id}
                title={show.title}
                image={show.image}
                link={show.link}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
