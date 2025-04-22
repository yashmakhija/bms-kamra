import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { XCircle, AlertTriangle, HomeIcon, ArrowRightIcon } from "lucide-react";
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
    }
  }, [bookingId, currentBooking, getBookingById, resetPaymentStatus]);

  const handleRetryPayment = () => {
    if (bookingId) {
      navigate(`/payment/${bookingId}`);
    } else if (currentBooking) {
      navigate(`/payment/${currentBooking.id}`);
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="container max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-xl">
        <Card className="w-full">
          <CardHeader className="flex flex-col items-center text-center">
            <XCircle className="w-20 h-20 text-red-500 mb-4" />
            <CardTitle className="text-3xl font-bold mb-2">
              Payment Cancelled
            </CardTitle>
            <CardDescription className="text-lg">
              Your payment was not completed. No charges have been made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentBooking && (
              <div className="space-y-4">
                <div className="bg-muted rounded-md p-4">
                  <div className="flex justify-between font-medium mb-2">
                    <span>Booking Reference:</span>
                    <span className="font-mono">
                      {currentBooking.id.substring(0, 12)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">
                      {currentBooking.currency === "INR"
                        ? "₹"
                        : currentBooking.currency}{" "}
                      {currentBooking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="uppercase font-semibold text-amber-600">
                      {currentBooking.status}
                    </span>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-4 flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    Your booking will be held for a limited time. Please
                    complete the payment soon to secure your tickets.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetryPayment}
              className="w-full sm:w-auto flex gap-2"
            >
              <ArrowRightIcon size={18} />
              <span>Try Again</span>
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full sm:w-auto flex gap-2"
            >
              <HomeIcon size={18} />
              <span>Back to Home</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default PaymentCancelPage;
