import { create } from "zustand";
import { apiClient } from "@repo/api-client";

export interface Booking {
  id: string;
  showId: string;
  userId: string;
  status: "CONFIRMED" | "PENDING" | "CANCELLED";
  totalAmount: number;
  bookingDate: Date;
  seats: {
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
  isLoading: boolean;
  error: string | null;
  fetchAllBookings: () => Promise<void>;
  fetchBookingsByShowId: (showId: string) => Promise<void>;
}

export const useBookingsStore = create<BookingsState>((set) => ({
  bookings: [],
  isLoading: false,
  error: null,

  fetchAllBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      // In a real implementation, this would be an API call
      // Mock data for demonstration purposes
      const mockBookings: Booking[] = [
        {
          id: "1",
          showId: "show1",
          userId: "user1",
          status: "CONFIRMED",
          totalAmount: 1500,
          bookingDate: new Date(),
          seats: [
            {
              id: "seat1",
              sectionId: "section1",
              sectionName: "Gold",
              price: 750,
            },
            {
              id: "seat2",
              sectionId: "section1",
              sectionName: "Gold",
              price: 750,
            },
          ],
          user: {
            name: "Rahul Sharma",
            email: "rahul@example.com",
            phone: "+91987654321",
          },
          show: {
            title: "Comedy Night with Kunal",
            date: "2023-09-15",
            venue: "Town Hall Delhi",
          },
        },
        {
          id: "2",
          showId: "show1",
          userId: "user2",
          status: "PENDING",
          totalAmount: 2200,
          bookingDate: new Date(),
          seats: [
            {
              id: "seat3",
              sectionId: "section2",
              sectionName: "VIP",
              price: 1100,
            },
            {
              id: "seat4",
              sectionId: "section2",
              sectionName: "VIP",
              price: 1100,
            },
          ],
          user: {
            name: "Priya Patel",
            email: "priya@example.com",
            phone: "+91876543210",
          },
          show: {
            title: "Comedy Night with Kunal",
            date: "2023-09-15",
            venue: "Town Hall Delhi",
          },
        },
        {
          id: "3",
          showId: "show2",
          userId: "user3",
          status: "CANCELLED",
          totalAmount: 1800,
          bookingDate: new Date(),
          seats: [
            {
              id: "seat5",
              sectionId: "section1",
              sectionName: "Gold",
              price: 900,
            },
            {
              id: "seat6",
              sectionId: "section1",
              sectionName: "Gold",
              price: 900,
            },
          ],
          user: {
            name: "Amit Kumar",
            email: "amit@example.com",
            phone: "+91765432109",
          },
          show: {
            title: "Kunal Kamra Live",
            date: "2023-09-20",
            venue: "Comedy Club Mumbai",
          },
        },
        {
          id: "4",
          showId: "show3",
          userId: "user4",
          status: "CONFIRMED",
          totalAmount: 2500,
          bookingDate: new Date(),
          seats: [
            {
              id: "seat7",
              sectionId: "section3",
              sectionName: "Platinum",
              price: 1250,
            },
            {
              id: "seat8",
              sectionId: "section3",
              sectionName: "Platinum",
              price: 1250,
            },
          ],
          user: {
            name: "Sneha Reddy",
            email: "sneha@example.com",
            phone: "+91654321098",
          },
          show: {
            title: "Political Comedy Special",
            date: "2023-09-25",
            venue: "Laugh Factory Bangalore",
          },
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      set({ bookings: mockBookings, isLoading: false });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      set({ error: "Failed to load bookings", isLoading: false });
    }
  },

  fetchBookingsByShowId: async (showId) => {
    set({ isLoading: true, error: null });
    try {
      // In a real implementation, this would be filtered by the API
      // For mock data, we'll filter client-side

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const { bookings } = useBookingsStore.getState();
      const filteredBookings = bookings.filter(
        (booking) => booking.showId === showId
      );

      set({ bookings: filteredBookings, isLoading: false });
    } catch (error) {
      console.error(`Error fetching bookings for show ${showId}:`, error);
      set({ error: "Failed to load bookings for this show", isLoading: false });
    }
  },
}));
