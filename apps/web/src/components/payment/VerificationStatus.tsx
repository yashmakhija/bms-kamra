import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useBookingStore } from "../../store/bookings";
import { useNavigate } from "react-router-dom";

export type VerificationResult = "success" | "retry" | "cancel";

interface VerificationStatusProps {
  bookingId: string;
  onClose?: (result: VerificationResult) => void;
}

export function VerificationStatus({
  bookingId,
  onClose,
}: VerificationStatusProps) {
  const navigate = useNavigate();
  const { isProcessingPayment, paymentError, paymentSuccess } =
    useBookingStore();

  const handleViewBooking = () => {
    if (onClose) onClose("success");
    else navigate(`/payment/success/${bookingId}`);
  };

  const handleRetryPayment = () => {
    if (onClose) onClose("retry");
    else navigate(`/payment/${bookingId}`);
  };

  const handleCancel = () => {
    if (onClose) onClose("cancel");
  };

  // Loading state
  if (isProcessingPayment) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-col items-center text-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
          <CardTitle>Verifying Payment</CardTitle>
          <CardDescription>
            Please wait while we verify your payment...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            This should only take a few seconds. Please do not close this window
            or refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (paymentError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-col items-center text-center">
          <XCircle className="w-16 h-16 text-destructive mb-4" />
          <CardTitle>Payment Failed</CardTitle>
          <CardDescription>{paymentError}</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            Your payment couldn't be processed. Please try again or use a
            different payment method.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleRetryPayment} className="w-full sm:w-auto">
            Try Again
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Success state
  if (paymentSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-col items-center text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>
            Your payment has been successfully processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            Your booking is confirmed and your tickets are ready. Thank you for
            your purchase!
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleViewBooking} className="w-full sm:w-auto">
            View Booking Details
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Default state (should not normally be shown)
  return null;
}
