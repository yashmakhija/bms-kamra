import { create } from "zustand";
import { apiClient } from "@repo/api-client";
import type { Venue } from "@repo/api-client";

// Define the possible response types from the API
interface VenuesResponse {
  venues: Venue[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface VenuesState {
  venues: Venue[];
  isLoading: boolean;
  error: string | null;
  fetchVenues: () => Promise<void>;
  getVenueById: (id: string) => Venue | undefined;
}

export const useVenuesStore = create<VenuesState>((set, get) => ({
  venues: [],
  isLoading: false,
  error: null,

  fetchVenues: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.getAllVenues();
      // Handle both array response and object with venues property
      const venues = Array.isArray(response)
        ? response
        : (response as VenuesResponse).venues || [];

      set({ venues, isLoading: false });
    } catch (error) {
      console.error("Error fetching venues:", error);
      set({
        venues: [], // Ensure venues is always an array even on error
        error: "Failed to fetch venues. Please try again.",
        isLoading: false,
      });
    }
  },

  getVenueById: (id: string) => {
    return get().venues.find((venue) => venue.id === id);
  },
}));
