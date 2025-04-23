import { Hero } from "../components/latest-upload/hero";
import LatestVideos from "../components/latest-upload/latest-video";
import { latestShows } from "../data/upload";

export default function LatestUploadsPage() {
  return (
    <div className="bg-neutral-900">
      <Hero />
      <LatestVideos shows={latestShows} />
    </div>
  );
}
