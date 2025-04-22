import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { useBookingStore } from "../../store/bookings";
import { useAuthStore } from "../../store/auth";
import { RAZORPAY_CONFIG } from "../../config/razorpay";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  bookingId,
}: PaymentModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentBooking,
    isProcessingPayment,
    paymentError,
    paymentSuccess,
    createRazorpayOrder,
    verifyRazorpayPayment,
    resetPaymentStatus,
    getBookingById,
  } = useBookingStore();

  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [razorpayInstance, setRazorpayInstance] = useState<any>(null);
  const [actualBookingId, setActualBookingId] = useState<string>(bookingId);

  // On mount, validate booking ID
  useEffect(() => {
    // If bookingId is not provided, try to get from localStorage
    const storedBookingId = localStorage.getItem("current_booking_id");

    if (!bookingId && storedBookingId) {
      console.log("Using stored booking ID:", storedBookingId);
      setActualBookingId(storedBookingId);
    }

    // Try to load the booking details if we don't have them
    if (!currentBooking && (bookingId || storedBookingId)) {
      const idToUse = bookingId || storedBookingId;
      if (idToUse) {
        getBookingById(idToUse);
      }
    }
  }, [bookingId, currentBooking, getBookingById]);

  // Load Razorpay script
  useEffect(() => {
    if (!isOpen) return;

    // Reset payment status when opening modal
    resetPaymentStatus();

    // Load Razorpay script if not already loaded
    if (!document.getElementById("razorpay-script") && !window.Razorpay) {
      try {
        const script = document.createElement("script");
        script.id = "razorpay-script";
        script.src = RAZORPAY_CONFIG.SCRIPT_URL;
        script.async = true;
        script.onload = () => {
          console.log("Razorpay script loaded successfully");
          setIsRazorpayLoaded(true);
        };
        script.onerror = (error) => {
          console.error("Failed to load Razorpay script:", error);
          useBookingStore.setState({
            paymentError: "Failed to load payment gateway. Please try again.",
          });
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error("Error appending Razorpay script:", error);
        useBookingStore.setState({
          paymentError:
            "Failed to initialize payment gateway. Please try again.",
        });
      }
    } else {
      console.log("Razorpay already loaded");
      setIsRazorpayLoaded(true);
    }
  }, [isOpen, resetPaymentStatus]);

  // Init payment when Razorpay is loaded and we have booking details
  useEffect(() => {
    if (!isOpen || !isRazorpayLoaded || !actualBookingId || isProcessingPayment)
      return;

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = RAZORPAY_CONFIG.MAX_RETRIES || 3;

    const initPayment = async () => {
      try {
        // Reset payment status before starting
        resetPaymentStatus();

        console.log("Creating Razorpay order for booking:", actualBookingId);
        const orderDetails = await createRazorpayOrder(actualBookingId);

        if (!isMounted) return;

        if (!orderDetails || !orderDetails.orderId) {
          console.error(
            "Failed to create Razorpay order: No order details returned"
          );
          throw new Error("Unable to create payment order. Please try again.");
        }

        console.log(
          "Razorpay order created successfully:",
          orderDetails.orderId
        );

        // Create Razorpay options with fallbacks for all required fields
        const options = {
          key: orderDetails.keyId || RAZORPAY_CONFIG.KEY_ID,
          amount: orderDetails.amount || 0,
          currency: orderDetails.currency || RAZORPAY_CONFIG.DEFAULT_CURRENCY,
          name: RAZORPAY_CONFIG.MERCHANT_NAME,
          description: "Payment for ticket booking",
          order_id: orderDetails.orderId,
          prefill: {
            name: user?.name || "Customer",
            email: user?.email || "customer@example.com",
            contact: user?.phone || "",
          },
          theme: {
            color: RAZORPAY_CONFIG.THEME_COLOR,
          },
          handler: function (response: any) {
            console.log(
              "Razorpay payment successful, verifying:",
              response.razorpay_payment_id
            );

            if (
              !response.razorpay_payment_id ||
              !response.razorpay_order_id ||
              !response.razorpay_signature
            ) {
              console.error("Invalid Razorpay response:", response);
              useBookingStore.setState({
                paymentError:
                  "Payment verification failed. Please contact support.",
              });
              return;
            }

            // Verify payment on our server but don't auto-redirect
            // The VerificationStatus component will show the appropriate UI
            verifyRazorpayPayment(
              actualBookingId,
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            ).then((success) => {
              if (success) {
                // Redirect to success page on successful verification
                navigate(`/payment/success/${actualBookingId}`);
              }
            });
          },
          modal: {
            ondismiss: function () {
              console.log("Payment modal dismissed by user");
              // Redirect to cancel page when user dismisses
              resetPaymentStatus();
              navigate(`/payment/cancel/${actualBookingId}`);
            },
          },
        };

        // Check if Razorpay is available in window
        if (!window.Razorpay) {
          throw new Error(
            "Razorpay SDK not loaded. Please refresh the page and try again."
          );
        }

        // Create Razorpay instance and immediately open payment
        const razorpay = new window.Razorpay(options);
        setRazorpayInstance(razorpay);

        // Automatically open Razorpay after successful initialization
        setTimeout(() => {
          if (isMounted) {
            console.log("Opening Razorpay payment window automatically");
            razorpay.open();
          }
        }, 500);
      } catch (error) {
        if (!isMounted) return;

        console.error("Razorpay initialization error:", error);

        // Check if we should retry
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `Retrying Razorpay initialization (${retryCount}/${maxRetries})...`
          );

          // Wait before retrying
          setTimeout(initPayment, RAZORPAY_CONFIG.RETRY_DELAY || 2000);
          return;
        }

        resetPaymentStatus();

        // Show appropriate error message
        if (error instanceof Error) {
          useBookingStore.setState({
            paymentError: error.message,
          });
        } else {
          useBookingStore.setState({
            paymentError: "Payment gateway error. Please try again later.",
          });
        }
      }
    };

    // Only run initPayment once when this effect is triggered
    initPayment();

    // Cleanup function
    return () => {
      isMounted = false;

      // Clear any potential retry timers
      retryCount = maxRetries;
    };
  }, [
    isOpen,
    isRazorpayLoaded,
    actualBookingId,
    createRazorpayOrder,
    user,
    verifyRazorpayPayment,
    resetPaymentStatus,
    navigate,
  ]);

  // Handle view booking click after successful payment
  const handleViewBooking = () => {
    onClose();
    resetPaymentStatus();
    navigate(`/payment/success/${actualBookingId}`);
  };

  // Handle retry payment
  const handleRetryPayment = () => {
    resetPaymentStatus();
    // The useEffect will re-initialize Razorpay
  };

  const renderContent = () => {
    // Loading state
    if (isProcessingPayment) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-4" />
          <p className="text-lg text-center">Processing your payment...</p>
          <p className="text-sm text-gray-500 text-center mt-2">
            Please do not close this window or refresh the page.
          </p>
        </div>
      );
    }

    // Error state
    if (paymentError) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
          <p className="text-lg font-semibold text-center">Payment Failed</p>
          <p className="text-sm text-gray-500 text-center mt-2 mb-6">
            {paymentError}
          </p>
          <Button
            onClick={handleRetryPayment}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Retry Payment
          </Button>
        </div>
      );
    }

    // Success state
    if (paymentSuccess) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <p className="text-lg font-semibold text-center">
            Payment Successful!
          </p>
          <p className="text-sm text-gray-500 text-center mt-2 mb-6">
            Your booking has been confirmed. You can view your booking details
            in your profile.
          </p>
          <Button
            onClick={handleViewBooking}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            View My Bookings
          </Button>
        </div>
      );
    }

    // Initial state - ready to pay
    return (
      <div className="space-y-4">
        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Booking Summary</h3>
          {currentBooking ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Amount</span>
                <span className="font-semibold">
                  {currentBooking.currency === "INR"
                    ? "₹"
                    : currentBooking.currency}{" "}
                  {currentBooking.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Tickets</span>
                <span>{currentBooking.tickets.length}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Booking ID</span>
                <span className="font-mono">
                  {currentBooking.id.substring(0, 8)}...
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading booking details...</p>
          )}
        </div>

        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Payment Method</h3>
          <div className="flex items-center space-x-2 p-2 border rounded-md border-gray-300 dark:border-gray-600">
            <CreditCard className="h-5 w-5 text-red-500" />
            <span>Razorpay (Credit/Debit Card, UPI, etc.)</span>
          </div>
        </div>

        <Button
          onClick={handleRetryPayment}
          disabled={!isRazorpayLoaded || !razorpayInstance}
          className="w-full py-6 bg-[#e31001] hover:bg-[#d31001] text-white font-medium text-lg rounded-xl transition-colors flex items-center justify-center"
        >
          {!isRazorpayLoaded ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading payment gateway...
            </>
          ) : (
            "Proceed to Payment"
          )}
        </Button>
      </div>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // We'll just close the dialog and let the parent component
          // handle any redirections if needed
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            {currentBooking
              ? `Secure payment for ${currentBooking.tickets.length} ${
                  currentBooking.tickets.length === 1 ? "ticket" : "tickets"
                }`
              : "Secure payment for your booking"}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
          {!paymentSuccess && !isProcessingPayment && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
              }}
              className="mt-2 sm:mt-0"
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
