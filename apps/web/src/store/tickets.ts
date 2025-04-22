import { create } from "zustand";
import {
  apiClient,
  Show as ApiShow,
  Event,
  Showtime,
  PriceTier,
} from "@repo/api-client";

export interface Ticket {
  id: string;
  showId: string;
  title: string;
  subtitle: string | null;
  date: string;
  time: string;
  venue: string;
  location: string;
  description: string[];
  ageLimit: string;
  language: string;
  thumbnailUrl: string;
  duration: string;
  price: {
    currency: string;
    amount: number;
  };
  events?: Event[];
  showtimes?: Showtime[];
  priceTiers?: PriceTier[];
}

interface TicketState {
  ticket: Ticket | null;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  loadTicket: (showId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (hasError: boolean, message?: string) => void;
}

// Helper function to transform ApiShow to Ticket format
const transformShowToTicket = (show: ApiShow): Ticket => {
  // Find the lowest price tier for the show
  // Use 'as any' to bypass the type checking issue
  const priceTiers = (show as any).priceTiers || [];
  const events = (show as any).events || [];
  const lowestPriceTier =
    priceTiers.length > 0
      ? priceTiers.reduce((lowest: PriceTier, current: PriceTier) => {
          return Number(current.price) < Number(lowest.price)
            ? current
            : lowest;
        }, priceTiers[0])
      : null;

  // Format description
  const formattedDescription = show.description
    ? show.description.split("\n\n").filter((para) => para.trim().length > 0)
    : ["Information about this show will be available soon."];

  // Find the first event and showtime if they exist
  const firstEvent = events[0];
  const firstShowtime = firstEvent?.showtimes?.[0];

  // Format date from API or use a default
  let formattedDate = "";
  if (firstEvent?.date) {
    const eventDate = new Date(firstEvent.date);
    formattedDate = eventDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } else {
    formattedDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Format time from API or use a default
  let formattedTime = "";
  if (firstShowtime?.startTime) {
    const startTime = new Date(firstShowtime.startTime);
    formattedTime = startTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    formattedTime = "8:00 PM";
  }

  return {
    id: show.id,
    showId: show.id,
    title: show.title,
    subtitle: show.subtitle || null,
    date: formattedDate,
    time: formattedTime,
    venue: show.venue?.name || "TBD",
    location: show.venue
      ? `${show.venue.city}, ${show.venue?.address}`
      : "Location to be announced",
    description: formattedDescription,
    ageLimit: show.ageLimit ? `${show.ageLimit}+` : "All ages",
    language: show.language || "English & Hindi",
    thumbnailUrl: show.thumbnailUrl || "/kunal-ticket.png", // Default image if none available
    duration: `${show.duration} mins`,
    price: {
      currency: "₹",
      amount: lowestPriceTier ? Number(lowestPriceTier.price) : 0,
    },
    // Store the original API data
    events: events,
    priceTiers: priceTiers,
  };
};

export const useTicketStore = create<TicketState>((set) => ({
  ticket: null,
  isLoading: false,
  hasError: false,
  errorMessage: null,

  loadTicket: async (showId: string) => {
    try {
      set({ isLoading: true, hasError: false, errorMessage: null });

      // No need to parse the showId, just use it directly to fetch from API
      const show = await apiClient.getShowById(showId);

      // Transform API show data to Ticket format
      const ticket = transformShowToTicket(show);

      set({ ticket, isLoading: false });
    } catch (error) {
      console.error("Failed to load ticket:", error);
      set({
        hasError: true,
        isLoading: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Failed to load ticket details",
      });
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (hasError: boolean, message?: string) =>
    set({
      hasError,
      errorMessage: message || null,
    }),
}));
