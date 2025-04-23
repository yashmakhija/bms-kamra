import { create } from "zustand";
import { apiClient, Booking, CreateBookingRequest } from "@repo/api-client";

interface BookingState {
  // Current booking
  currentBooking: Booking | null;
  isCreatingBooking: boolean;
  bookingError: string | null;

  // User's bookings history
  userBookings: Booking[];
  isLoadingUserBookings: boolean;
  userBookingsError: string | null;

  // Payment status
  isProcessingPayment: boolean;
  paymentError: string | null;
  paymentSuccess: boolean;

  // Razorpay
  razorpayOrderId: string | null;
  razorpayKeyId: string | null;

  // Viewed bookings
  viewedBookings: Record<string, Booking>;

  // Methods
  createBooking: (bookingData: CreateBookingRequest) => Promise<Booking | null>;
  getUserBookings: () => Promise<Booking[]>;
  getBookingById: (id: string) => Promise<Booking | null>;
  resetCurrentBooking: () => void;
  resetPaymentStatus: () => void;
  cancelBooking: (id: string) => Promise<boolean>;
  createRazorpayOrder: (bookingId: string) => Promise<{
    orderId: string;
    keyId: string;
    amount: number;
    currency: string;
  } | null>;
  verifyRazorpayPayment: (
    bookingId: string,
    paymentId: string,
    orderId: string,
    signature: string
  ) => Promise<boolean>;
  isLoading: boolean;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  // State
  currentBooking: null,
  isCreatingBooking: false,
  bookingError: null,

  userBookings: [],
  isLoadingUserBookings: false,
  userBookingsError: null,

  isProcessingPayment: false,
  paymentError: null,
  paymentSuccess: false,

  razorpayOrderId: null,
  razorpayKeyId: null,

  viewedBookings: {},

  isLoading: false,

  // Methods
  createBooking: async (bookingData) => {
    try {
      set({ isCreatingBooking: true, bookingError: null });
      console.log("Creating booking with data:", bookingData);

      const booking = await apiClient.createBooking(bookingData);

      // Store the booking in local storage to ensure it's available for Razorpay
      if (booking && booking.id) {
        localStorage.setItem("current_booking_id", booking.id);
        console.log("Booking created and stored, ID:", booking.id);
      }

      set({
        currentBooking: booking,
        isCreatingBooking: false,
      });
      return booking;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create booking";
      console.error("Booking creation error:", errorMessage);
      set({
        bookingError: errorMessage,
        isCreatingBooking: false,
      });
      return null;
    }
  },

  getUserBookings: async () => {
    try {
      set({ isLoadingUserBookings: true, userBookingsError: null });
      const bookings = await apiClient.getUserBookings();
      set({
        userBookings: bookings,
        isLoadingUserBookings: false,
      });
      return bookings;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load your bookings";
      set({
        userBookingsError: errorMessage,
        isLoadingUserBookings: false,
      });
      return [];
    }
  },

  getBookingById: async (id: string) => {
    try {
      // Check if the booking is already in our cache
      const existingBooking = get().viewedBookings[id];
      if (existingBooking) {
        set({ currentBooking: existingBooking });
        return existingBooking;
      }

      // If not in cache, fetch from API
      set({ isLoading: true, bookingError: null });
      const booking = await apiClient.getBookingById(id);

      // Store in cache and set as current booking
      set((state) => ({
        currentBooking: booking,
        viewedBookings: {
          ...state.viewedBookings,
          [id]: booking,
        },
      }));

      return booking;
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to fetch booking details";

      set({ bookingError: errorMsg });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetCurrentBooking: () => {
    set({
      currentBooking: null,
      bookingError: null,
      razorpayOrderId: null,
      razorpayKeyId: null,
    });
  },

  resetPaymentStatus: () => {
    set({
      isProcessingPayment: false,
      paymentError: null,
      paymentSuccess: false,
    });
  },

  cancelBooking: async (id) => {
    try {
      const result = await apiClient.cancelBooking(id);
      if (result.success) {
        // Update the booking list if it exists
        const { userBookings } = get();
        if (userBookings.length > 0) {
          const updatedBookings = userBookings.map((booking) =>
            booking.id === id ? result.booking : booking
          );
          set({ userBookings: updatedBookings });
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  createRazorpayOrder: async (bookingId) => {
    try {
      // If no booking ID is provided, check localStorage
      const actualBookingId =
        bookingId || localStorage.getItem("current_booking_id");

      // Verify booking ID is valid
      if (
        !actualBookingId ||
        typeof actualBookingId !== "string" ||
        actualBookingId.trim() === ""
      ) {
        throw new Error("Invalid or missing booking ID");
      }

      console.log("Creating Razorpay order for booking:", actualBookingId);

      set({
        isProcessingPayment: true,
        paymentError: null,
        paymentSuccess: false,
      });

      const response = await apiClient.createRazorpayOrder(actualBookingId);

      set({
        razorpayOrderId: response.orderId,
        razorpayKeyId: response.keyId,
        isProcessingPayment: false,
      });

      return {
        orderId: response.orderId,
        keyId: response.keyId,
        amount: response.amount,
        currency: response.currency || "INR",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create payment order";

      console.error("Razorpay order creation failed:", errorMessage);

      set({
        paymentError: errorMessage,
        isProcessingPayment: false,
      });

      return null;
    }
  },

  verifyRazorpayPayment: async (bookingId, paymentId, orderId, signature) => {
    try {
      set({
        isProcessingPayment: true,
        paymentError: null,
        paymentSuccess: false,
      });

      console.log(`Verifying payment for booking ${bookingId}`, {
        paymentId,
        orderId,
        signatureLength: signature ? signature.length : 0,
      });

      const result = await apiClient.verifyRazorpayPayment(bookingId, {
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: signature,
      });

      if (result && result.status === "success") {
        const updatedBooking = await apiClient.getBookingById(bookingId);

        set({
          currentBooking: updatedBooking,
          paymentSuccess: true,
          isProcessingPayment: false,
        });

        const { userBookings } = get();
        if (userBookings.length > 0) {
          const updatedBookings = userBookings.map((booking) =>
            booking.id === bookingId ? updatedBooking : booking
          );
          set({ userBookings: updatedBookings });
        }

        console.log("Payment verification successful for booking:", bookingId);
        return true;
      }

      console.error(
        "Payment verification failed:",
        result?.message || "Unknown error"
      );
      set({
        paymentError: result?.message || "Payment verification failed",
        isProcessingPayment: false,
      });
      return false;
    } catch (error) {
      console.error("Payment verification error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify payment";
      set({
        paymentError: errorMessage,
        isProcessingPayment: false,
      });
      return false;
    }
  },
}));
