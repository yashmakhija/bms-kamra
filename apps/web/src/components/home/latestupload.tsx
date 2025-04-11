"use client";

import { ShowCard } from "../show-card";
import { cn } from "@repo/ui/utils";

interface LatestShow {
  id: string;
  title: string;
  image: string;
}

interface LatestUploadsProps {
  shows: LatestShow[];
  className?: string;
}

export function LatestUploads({ shows, className }: LatestUploadsProps) {
  return (
    <section className={cn("w-full py-12 bg-[#171717]", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-white text-4xl font-bold leading-tight mb-8 tracking-wide">
          Latest Uploads
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
