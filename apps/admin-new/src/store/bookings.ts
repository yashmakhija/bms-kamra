import { create } from "zustand";
import { apiClient } from "@repo/api-client";
import type { Booking as ApiBooking, BookingStatus } from "@repo/api-client";

export interface Booking extends Omit<ApiBooking, "tickets"> {
  seats?: {
    id: string;
    sectionId: string;
    sectionName?: string;
    price: number;
  }[];
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  show?: {
    title: string;
    date?: string;
    venue?: string;
  };
}

interface BookingsState {
  bookings: Booking[];
  totalBookings: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  fetchAllBookings: (
    page?: number,
    limit?: number,
    status?: string,
    userId?: string,
    showId?: string
  ) => Promise<void>;
  fetchBookingsByShowId: (showId: string) => Promise<void>;
}

export const useBookingsStore = create<BookingsState>((set, get) => ({
  bookings: [],
  totalBookings: 0,
  currentPage: 1,
  totalPages: 1,
  pageSize: 20,
  isLoading: false,
  error: null,

  fetchAllBookings: async (page = 1, limit = 20, status, userId, showId) => {
    set({ isLoading: true, error: null });
    try {
      // Call the admin API to get all bookings with filters
      const response = await apiClient.getAllBookings(
        page,
        limit,
        status,
        userId,
        showId
      );

      // Transform the bookings to match our UI structure
      const transformedBookings: Booking[] = response.bookings.map(
        (booking: ApiBooking) => {
          // Extract ticket information for our UI
          const seats =
            booking.tickets?.map((ticket) => ({
              id: ticket.id,
              sectionId: ticket.sectionId,
              sectionName: "Unknown Section", // This would come from the section data
              price:
                typeof ticket.price === "number"
                  ? ticket.price
                  : parseFloat(ticket.price as any),
            })) || [];

          // Format for our UI
          return {
            ...booking,
            seats,
            // Add additional UI-specific fields that may come from joins in a real API
          user: {
              name: "Customer", // This would come from the user data
              email: "customer@example.com", // This would come from the user data
              phone: "", // This would come from the user data
          },
          show: {
              title: "Show Title", // This would come from the show data
              date: new Date().toISOString(), // This would come from the event data
              venue: "Venue Name", // This would come from the venue data
          },
          };
        }
      );

      set({
        bookings: transformedBookings,
        totalBookings: response.total,
        currentPage: response.page,
        totalPages: Math.ceil(response.total / response.limit),
        pageSize: response.limit,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      set({ error: "Failed to load bookings", isLoading: false });
    }
  },

  fetchBookingsByShowId: async (showId) => {
    set({ isLoading: true, error: null });
    try {
      // Use the same fetchAllBookings method with a showId filter
      await get().fetchAllBookings(1, 100, undefined, undefined, showId);
    } catch (error) {
      console.error(`Error fetching bookings for show ${showId}:`, error);
      set({ error: "Failed to load bookings for this show", isLoading: false });
    }
  },
}));
