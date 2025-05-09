import { Podcast } from "../components/podcasts/podcast";
import { podcastShows } from "../data/podcast";
export default function Podcasts() {
  return (
    <div className="bg-[#111111]  pt-20">
      {/* <Hero /> */}
      <Podcast title="Nope w/ Kunal Kamra" shows={podcastShows} />
    </div>
  );
}
