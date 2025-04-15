import { Hero } from "../components/home/hero";
import { UpcomingShows } from "../components/home/upcoming-shows";
import { LatestUploads } from "../components/home/latestupload";
import { shows } from "../data/shows";
import { latestShows } from "../data/upload";

export function HomePage() {
  return (
    <>
      <Hero />
      <UpcomingShows shows={shows} />
      <LatestUploads shows={latestShows} />
    </>
  );
}
