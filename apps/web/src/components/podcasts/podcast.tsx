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
  link?: string;
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

export function Podcast({ shows, className }: LatestUploadsProps) {
  return (
    <section className={cn("w-full py-12 bg-[#171717]", className)}>
      <div className="container mx-auto px-4 md:px-8 lg:px-30">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          {shows.map((show) => (
            <div
              key={show.id}
              className="w-full max-w-[420px] mx-auto md:max-w-none mb-8 md:mb-6"
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
    </section>
  );
}
