// import { Hero } from "../components/latest-upload/hero";
import LatestVideos from "../components/latest-upload/latest-video";
import { latestShows } from "../data/upload";

export default function LatestUploadsPage() {
  return (
    <div className="bg-[#111111] pt-20">
      {/* <Hero /> */}
      <LatestVideos title="Watch Latest Videos" shows={latestShows} />
    </div>
  );
}
