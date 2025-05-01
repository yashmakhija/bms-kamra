import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useBookingStore } from "../../../store/bookings";
import { useEffect } from "react";

export function PaymentCancelHero() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { currentBooking, getBookingById, resetPaymentStatus } =
    useBookingStore();

  useEffect(() => {
    // Reset payment status to clear any errors
    resetPaymentStatus();

    // If we have a booking ID in params but no current booking, fetch it
    if (bookingId && !currentBooking) {
      getBookingById(bookingId);
    } else if (!bookingId && !currentBooking) {
      // Try to get the booking ID from localStorage if not in URL or store
      const storedBookingId = localStorage.getItem("current_booking_id");
      if (storedBookingId) {
        getBookingById(storedBookingId);
      }
    }
  }, [bookingId, currentBooking, getBookingById, resetPaymentStatus]);

  const handleRetryPayment = () => {
    const id =
      bookingId ||
      currentBooking?.id ||
      localStorage.getItem("current_booking_id");
    if (id) {
      navigate(`/payment/${id}`);
    } else {
      navigate("/"); // Fallback to home if no ID is available
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <section className="w-full py-12 pt-20 bg-[#450C0C]">
      <div className="container mx-auto px-4 py-12">
        {/* Error Message */}
        <div className="flex flex-col items-center justify-center mb-16">
          {/* Yellow warning triangle in dark circle */}
          <div className="w-24 h-24 p-6 bg-[#1d1d1d] rounded-[30px] inline-flex justify-start items-center gap-6 overflow-hidden mb-8">
            <AlertTriangle
              className="w-12 h-11 text-[#F2F900]  absolute  outline-offset-[-2.19px] "
              strokeWidth={2}
            />
          </div>

          <h1 className="text-white text-5xl font-bold mb-4 text-center">
            Oh no, your payment failed
          </h1>

          <p className="justify-center text-center text-white/80 text-lg font-normal leading-snug">
            We were unable to process your information with the vendor. Please
            try again.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button
              className="bg-white cursor-pointer text-black hover:bg-neutral-200 rounded-full px-6 py-5 text-base"
              onClick={handleGoHome}
            >
              Go Back
            </Button>

            <Button
              className="bg-[#F2F900] cursor-pointer text-black hover:bg-[#F2F900]/90 rounded-full px-6 py-5 text-base"
              onClick={handleRetryPayment}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PaymentCancelHero;
