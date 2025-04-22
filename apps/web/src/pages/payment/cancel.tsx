import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  XCircle,
  AlertTriangle,
  HomeIcon,
  ArrowRightIcon,
  Calendar,
  Clock,
  TicketIcon,
} from "lucide-react";
import { useBookingStore } from "../../store/bookings";
import { useEffect } from "react";

export function PaymentCancelPage() {
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
    <section className="w-full py-12 bg-[#171717] min-h-[90vh] flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto">
          {/* Cancel header */}
          <div className="mb-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4 mx-auto" />
            <h2 className="text-3xl text-white font-bold mb-2">
              Payment Cancelled
            </h2>
            <p className="text-neutral-300">
              Your payment was not completed. No charges have been made.
            </p>
          </div>

          {/* Ticket Card - styled exactly like upcoming-shows.tsx */}
          {currentBooking && (
            <div className="bg-neutral-800 rounded-[20px] p-6 text-white">
              <div className="space-y-8">
                <h2 className="text-xl text-neutral-100 font-semibold leading-snug">
                  Incomplete Payment
                </h2>

                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {/* Info Item 1 */}
                  <div className="flex items-start gap-3">
                    <div className="text-[#e31001] mt-1">
                      <TicketIcon size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] font-normal leading-3">
                        Booking Reference
                      </p>
                      <p className="text-neutral-100 text-sm font-normal leading-none mt-0.5 font-mono">
                        {currentBooking.id.substring(0, 10)}
                      </p>
                    </div>
                  </div>

                  {/* Info Item 2 */}
                  <div className="flex items-start gap-3">
                    <div className="text-[#e31001] mt-1">
                      <Calendar size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] font-normal leading-3">
                        Date
                      </p>
                      <p className="text-neutral-100 text-sm font-normal leading-none mt-0.5">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Info Item 3 */}
                  <div className="flex items-start gap-3">
                    <div className="text-[#e31001] mt-1">
                      <Clock size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] font-normal leading-3">
                        Status
                      </p>
                      <p className="text-neutral-100 text-sm font-normal leading-none mt-0.5">
                        <span className="text-amber-500 uppercase font-medium">
                          {currentBooking.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Info Item 4 */}
                  <div className="flex items-start gap-3">
                    <div className="text-[#e31001] mt-1">
                      <TicketIcon size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] font-normal leading-3">
                        Tickets
                      </p>
                      <p className="text-neutral-100 text-sm font-normal leading-none mt-0.5">
                        {currentBooking.tickets.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-[-24px] right-[-24px] h-1 flex items-center">
                    {/* Left Edge Circle */}
                    <div className="absolute left-0 -translate-y-1/2 -translate-x-1/2 w-8 h-6 bg-[#171717] rounded-full" />

                    {/* Right Edge Circle */}
                    <div className="absolute right-0 -translate-y-1/2 translate-x-1/2 w-8 h-6 bg-[#171717] rounded-full" />

                    {/* Dotted Line */}
                    <div className="w-full flex justify-between items-center px-6">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div
                          key={i}
                          className={
                            i % 3 === 1
                              ? "h-[3px] mb-5 rounded-full bg-neutral-900 w-4"
                              : "h-[3px] mb-5 rounded-full bg-neutral-900 w-2"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-2xl text-neutral-50 font-bold tracking-tight">
                    {currentBooking.currency === "INR"
                      ? "₹"
                      : currentBooking.currency}{" "}
                    {currentBooking.totalAmount.toLocaleString()}
                    <span className="text-xs text-neutral-400 font-normal ml-1">
                      (incl. all taxes)
                    </span>
                  </p>

                  <div className="bg-amber-950/30 border border-amber-900 rounded-lg p-4 flex items-start gap-3 mt-4">
                    <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-400">
                      Your booking will be held for a limited time. Please
                      complete the payment soon to secure your tickets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleRetryPayment}
              className="bg-[#e31001] hover:bg-[#d31001] text-white w-full sm:flex-1 flex gap-2 justify-center py-6 rounded-xl"
            >
              <ArrowRightIcon size={18} />
              <span>Try Again</span>
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="border-neutral-700 text-white hover:bg-neutral-700 w-full sm:flex-1 flex gap-2 justify-center py-6 rounded-xl"
            >
              <HomeIcon size={18} />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PaymentCancelPage;
