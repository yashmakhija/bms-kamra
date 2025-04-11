import { Navbar } from "../components/layout/navbar/navbar";
import { Hero } from "../components/home/hero";
import { UpcomingShows } from "../components/home/upcoming-shows";
import { LatestUploads } from "../components/home/latestupload";
import { shows } from "../data/shows";
import { latestShows } from "../data/upload";
import { Footer } from "../components/layout/footer";
export function HomePage() {
  return (
    <>
      <Hero />
      <UpcomingShows shows={shows} />
      <LatestUploads shows={latestShows} />
    </>
  );
}
