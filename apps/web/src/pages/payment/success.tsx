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
import { CheckCircle, TicketIcon, HomeIcon, UserIcon } from "lucide-react";
import { useBookingStore } from "../../store/bookings";
import { useEffect } from "react";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { currentBooking, getBookingById } = useBookingStore();

  useEffect(() => {
    // If we have a booking ID in params but no current booking, fetch it
    if (bookingId && !currentBooking) {
      getBookingById(bookingId);
    }
  }, [bookingId, currentBooking, getBookingById]);

  // Only redirect to ticket page on user's explicit action
  const handleViewTickets = () => {
    if (bookingId) {
      navigate(`/booking/${bookingId}`);
    } else if (currentBooking) {
      navigate(`/booking/${currentBooking.id}`);
    }
  };

  const handleViewProfile = () => {
    navigate("/profile");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="container max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-xl">
        <Card className="w-full">
          <CardHeader className="flex flex-col items-center text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-bold mb-2">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg">
              Thank you for your purchase. Your tickets are confirmed.
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
                    <span>Tickets:</span>
                    <span>{currentBooking.tickets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="uppercase font-semibold text-green-600">
                      {currentBooking.status}
                    </span>
                  </div>
                </div>
                <p className="text-center text-muted-foreground">
                  A confirmation has been sent to your email. You can view and
                  download your tickets from your profile.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleViewTickets}
              className="w-full sm:w-auto flex gap-2"
            >
              <TicketIcon size={18} />
              <span>View Tickets</span>
            </Button>
            <Button
              onClick={handleViewProfile}
              variant="outline"
              className="w-full sm:w-auto flex gap-2"
            >
              <UserIcon size={18} />
              <span>My Profile</span>
            </Button>
            <Button
              onClick={handleGoHome}
              variant="ghost"
              className="w-full sm:w-auto flex gap-2"
            >
              <HomeIcon size={18} />
              <span>Home</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
