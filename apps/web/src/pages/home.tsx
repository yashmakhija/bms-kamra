import { Hero } from "../components/home/hero";
import { UpcomingShows } from "../components/home/upcoming-shows";
import { LatestUploads } from "../components/home/latestupload";
import { latestShows } from "../data/upload";

import { Podcast } from "../components/home/podcast-home";
import { podcastShows } from "../data/podcast";
import { RecentArticles } from "../components/home/recentArticles";
export function HomePage() {
  return (
    <div className="bg-[#111]">
      <Hero />
      {/* <AboutMe /> */}
      <UpcomingShows className="mt-20" removeButton={false} title="Tickets" />
      <Podcast shows={podcastShows} title="Podcasts" />
      <RecentArticles />
      <LatestUploads shows={latestShows} />
    </div>
  );
}
