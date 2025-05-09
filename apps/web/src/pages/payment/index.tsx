import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  VerificationStatus,
  VerificationResult,
} from "../../components/payment/VerificationStatus";
import { useBookingStore } from "../../store/bookings";
import { PaymentModal } from "../../components/booking/payment-modal";

export function PaymentProcessingPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    getBookingById,
    currentBooking,
    isProcessingPayment,
    paymentError,
    paymentSuccess,
    resetPaymentStatus,
  } = useBookingStore();

  useEffect(() => {
    if (bookingId) {
      resetPaymentStatus();
      getBookingById(bookingId);
      setIsModalOpen(true);
    } else {
      navigate("/");
    }
  }, [bookingId, getBookingById, navigate, resetPaymentStatus]);

  useEffect(() => {
    if (!bookingId) return;

    if (paymentSuccess) {
      navigate(`/payment/success/${bookingId}`);
    } else if (paymentError) {
      setIsModalOpen(false);
    }
  }, [paymentSuccess, paymentError, isProcessingPayment, bookingId, navigate]);

  const handleCloseModal = () => {
    setIsModalOpen(false);

    if (!isProcessingPayment && !paymentSuccess && !paymentError) {
      navigate(`/payment/cancel/${bookingId}`);
    }
  };

  const handleVerificationAction = (action: VerificationResult) => {
    setIsModalOpen(false);

    switch (action) {
      case "success":
        navigate(`/payment/success/${bookingId}`);
        break;
      case "cancel":
        navigate(`/payment/cancel/${bookingId}`);
        break;
      case "retry":
        resetPaymentStatus();
        setIsModalOpen(true);
        break;
    }
  };

  return (
    <div className=" w-full bg-[#111111] p-4 flex flex-col items-center justify-center min-h-[80vh]">
      {bookingId && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          bookingId={bookingId}
        />
      )}

      {(isProcessingPayment || paymentError || paymentSuccess) && bookingId && (
        <VerificationStatus
          bookingId={bookingId}
          onClose={(result) => {
            if (result === "success") {
              handleVerificationAction("success");
            } else if (result === "retry") {
              handleVerificationAction("retry");
            } else {
              handleVerificationAction("cancel");
            }
          }}
        />
      )}
    </div>
  );
}

export default PaymentProcessingPage;
