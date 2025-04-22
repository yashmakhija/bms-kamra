import { Hero } from "../components/podcasts/hero";
import { Podcast } from "../components/podcasts/podcast";
import { podcastShows } from "../data/podcast";
export default function Podcasts() {
  return (
    <div className="bg-neutral-900">
      <Hero />
      <Podcast shows={podcastShows} />
    </div>
  );
}
