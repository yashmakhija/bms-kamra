import React from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { useBookingStore } from "../../store/bookings";
import { useNavigate } from "react-router-dom";
import { cn } from "@repo/ui/utils";

export type VerificationResult = "success" | "retry" | "cancel";

interface VerificationStatusProps {
  bookingId: string;
  onClose?: (result: VerificationResult) => void;
  className?: string;
}

export function VerificationStatus({
  bookingId,
  onClose,
  className,
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
    else navigate("/");
  };

  // Loading state
  if (isProcessingPayment) {
    return (
      <div className={cn("w-full max-w-xl mx-auto py-12", className)}>
        <div className="flex flex-col items-center justify-center">
          {/* Spinner container */}
          <div className="w-24 h-24 rounded-full bg-[#1D1D1D] flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 rounded-full border-4 border-t-[#F2F900] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-[#F2F900] border-b-transparent border-l-transparent animate-spin animation-delay-200"></div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Verifying Payment
          </h2>

          <p className="text-neutral-300 text-lg text-center max-w-md mb-6">
            Please wait while we verify your payment
          </p>

          <div className="bg-[#1D1D1D] rounded-xl p-5 max-w-md">
            <p className="text-white text-center">
              This should only take a few seconds. Please do not close this
              window or refresh the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (paymentError) {
    return (
      <div className={cn("w-full max-w-xl mx-auto py-12", className)}>
        <div className="flex flex-col items-center justify-center">
          {/* Error icon */}
          <div className="w-24 h-24 rounded-full bg-[#450C0C] flex items-center justify-center mb-8">
            <AlertTriangle
              className="w-12 h-12 text-[#F2F900]"
              strokeWidth={2}
            />
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Payment Failed
          </h2>

          <p className="text-neutral-300 text-lg text-center max-w-md mb-8">
            {paymentError ||
              "Your payment couldn't be processed. Please try again or use a different payment method."}
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Button
              onClick={handleCancel}
              className="bg-white text-black hover:bg-neutral-200 rounded-full px-6 py-5 text-base"
            >
              Go Back
            </Button>

            <Button
              onClick={handleRetryPayment}
              className="bg-[#F2F900] text-black hover:bg-[#F2F900]/90 rounded-full px-6 py-5 text-base"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (paymentSuccess) {
    return (
      <div className={cn("w-full max-w-xl mx-auto py-12", className)}>
        <div className="flex flex-col items-center justify-center">
          {/* Success icon */}
          <div className="w-24 h-24 rounded-full bg-[#234618] flex items-center justify-center mb-8">
            <CheckCircle className="w-12 h-12 text-[#F2F900]" strokeWidth={2} />
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Payment Successful!
          </h2>

          <p className="text-neutral-300 text-lg text-center max-w-md mb-8">
            Your booking is confirmed and your tickets are ready. Thank you for
            your purchase!
          </p>

          <Button
            onClick={handleViewBooking}
            className="bg-[#F2F900] text-black hover:bg-[#F2F900]/90 rounded-full px-6 py-5 text-base flex items-center gap-2"
          >
            View Booking Details
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    );
  }

  // Default state (should not normally be shown)
  return null;
}
