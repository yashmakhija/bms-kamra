import { LatestUploads } from "../../components/home/latestupload";
import { UpcomingShows } from "../../components/home/upcoming-shows";
import { PaymentSuccessHero } from "../../components/payment/sucess/hero";
import { latestShows } from "../../data/upload";
import { useBookingStore } from "../../store/bookings";

export default function PaymentSuccessPage() {
  const getBookedShowId = useBookingStore((state) => state.currentBooking?.id);
  return (
    <div className="bg-[#111111]">
      <PaymentSuccessHero />
      <div className="container mx-auto px-4 py-12">
        <UpcomingShows
          limit={4}
          title="Similar Shows"
          removeButton={true}
          excludeShowId={getBookedShowId}
          removeArrow={true}
        />
        <div className="flex justify-center">
          <LatestUploads shows={latestShows} />
          </div>
      </div>
    </div>
  );
}
