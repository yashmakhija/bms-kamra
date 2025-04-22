import { Hero } from "../components/home/hero";
import { UpcomingShows } from "../components/home/upcoming-shows";
import { LatestUploads } from "../components/home/latestupload";
import { latestShows } from "../data/upload";
import { AboutMe } from "../components/home/aboutMe";
import { Podcast } from "../components/home/podcast";
import { podcastShows } from "../data/podcast";
import { RecentArticles } from "../components/home/recentArticles";
export function HomePage() {
  return (
    <>
      <Hero />
      <AboutMe />
      <UpcomingShows />
      <Podcast shows={podcastShows} title="Podcasts" />
      <LatestUploads shows={latestShows} />
      <RecentArticles />
    </>
  );
}
