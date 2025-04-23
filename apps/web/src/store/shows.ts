import { create } from "zustand";
import { apiClient, Show as ApiShow, PriceTier } from "@repo/api-client";
import { ticketData } from "../components/ticket/ticket";

// Extend the ApiShow interface to include priceTiers
interface ExtendedApiShow extends ApiShow {
  priceTiers?: PriceTier[];
}

export interface Show {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  venue: string;
  price: {
    amount: number;
    currency: string;
  };
}

interface ShowsState {
  shows: Show[];
  apiShows: ExtendedApiShow[];
  selectedShowId: string | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;

  // Actions
  fetchShows: () => Promise<void>;
  setShows: (shows: Show[]) => void;
  selectShow: (id: string) => void;
  setLoading: (loading: boolean) => void;
  getTicketIdFromShowId: (showId: string) => string;
  getShowById: (id: string) => Promise<Show>;
}

// Map API show to UI show format
const transformApiShow = (apiShow: ExtendedApiShow): Show => {
  // Find the lowest price tier for the show
  const lowestPriceTier =
    apiShow.priceTiers && apiShow.priceTiers.length > 0
      ? apiShow.priceTiers.reduce((lowest: PriceTier, current: PriceTier) => {
          return Number(current.price) < Number(lowest.price)
            ? current
            : lowest;
        }, apiShow.priceTiers[0])
      : null;

  // For demo purposes, we'll create some default date/time values
  // In a real app, you would get these from events and showtimes
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 30); // 30 days in future

  return {
    id: apiShow.id,
    title: apiShow.title,
    date: new Date(futureDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: "8:00 PM", // Default time (in real app would come from showtimes)
    duration: `${apiShow.duration} mins`,
    venue: apiShow.venue
      ? `${apiShow.venue.name}, ${apiShow.venue.city}`
      : "TBD",
    price: {
      amount: lowestPriceTier ? Number(lowestPriceTier.price) : 0,
      currency: "₹",
    },
  };
};

// Create a dynamic map of show IDs to ticket IDs
const createShowToTicketMap = (shows: ExtendedApiShow[]) => {
  const map: Record<string, string> = {};
  shows.forEach((show, index) => {
    map[show.id] = `${ticketData.id}-${index + 1}`;
  });
  return map;
};

export const useShowsStore = create<ShowsState>((set, get) => ({
  shows: [],
  apiShows: [],
  selectedShowId: null,
  isLoading: false,
  isError: false,
  errorMessage: null,

  fetchShows: async () => {
    try {
      set({ isLoading: true, isError: false, errorMessage: null });
      const response = await apiClient.getAllShows();

      // Store the original API response
      set({ apiShows: response.shows });

      // Transform API shows to UI format
      const transformedShows = response.shows.map(transformApiShow);

      set({ shows: transformedShows, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch shows:", error);
      set({
        isLoading: false,
        isError: true,
        errorMessage:
          error instanceof Error ? error.message : "Failed to fetch shows",
      });
    }
  },

  setShows: (shows: Show[]) => set({ shows }),
  selectShow: (id: string) => set({ selectedShowId: id }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  getTicketIdFromShowId: (showId: string) => {
    const { apiShows } = get();
    const showToTicketMap = createShowToTicketMap(apiShows);
    return showToTicketMap[showId] || ticketData.id;
  },

  getShowById: async (id: string) => {
    try {
      set({ isLoading: true, isError: false, errorMessage: null });
      const showData = await apiClient.getShowById(id);

      // Update the store with the fetched show if it doesn't already exist
      set((state) => {
        const existingShowIndex = state.shows.findIndex((s) => s.id === id);
        if (existingShowIndex === -1) {
          return { shows: [...state.shows, showData] };
        }
        // If show already exists, update it
        const updatedShows = [...state.shows];
        updatedShows[existingShowIndex] = showData;
        return { shows: updatedShows };
      });

      return showData;
    } catch (error) {
      console.error("Error fetching show by ID:", error);
      set({
        isError: true,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Failed to fetch show details",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
