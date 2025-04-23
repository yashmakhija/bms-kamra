import { Hero } from "../components/home/hero";
import { UpcomingShows } from "../components/home/upcoming-shows";
import { LatestUploads } from "../components/home/latestupload";
import { latestShows } from "../data/upload";
import { AboutMe } from "../components/home/aboutMe";
import { Podcast } from "../components/home/podcast-home";
import { podcastShows } from "../data/podcast";
import { RecentArticles } from "../components/home/recentArticles";
export function HomePage() {
  return (
    <div className="bg-gradient-to-b from-[#171717] to-[#510000]">
      <Hero />
      <AboutMe />
      <UpcomingShows removeButton={false} title="Upcoming Shows" />
      <Podcast shows={podcastShows} title="Podcasts" />
      <LatestUploads shows={latestShows} />
      <RecentArticles />
    </div>
  );
}
