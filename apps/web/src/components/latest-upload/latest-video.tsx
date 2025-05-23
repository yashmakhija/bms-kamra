"use client";

import { ShowCard } from "../show-card";
import { cn } from "@repo/ui/utils";

interface LatestShow {
  id: string;
  title: string;
  image: string;
  link: string;
}

interface LatestUploadsProps {
  shows: LatestShow[];
  className?: string;
  title: string;
}

export default function LatestUploads({
  shows,
  className,
  title,
}: LatestUploadsProps) {
  return (
    <section className={cn("w-full py-12 bg-[#111111] ", className)}>
      <div className="container mx-auto px-4 md:px-8 lg:px-30">
        <h2 className="justify-center text-white text-4xl font-bold leading-10 mb-4">
          {title}
        </h2>
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
