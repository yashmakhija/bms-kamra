import { create } from "zustand";
import { ticketData } from "../components/ticket/ticket";

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
  selectedShowId: string | null;
  isLoading: boolean;
  setShows: (shows: Show[]) => void;
  selectShow: (id: string) => void;
  setLoading: (loading: boolean) => void;
  getTicketIdFromShowId: (showId: string) => string;
}

// Map show IDs to ticket IDs
const showToTicketMap = {
  "1": `${ticketData.id}-1`,
  "2": `${ticketData.id}-2`,
  "3": `${ticketData.id}-3`,
  "4": `${ticketData.id}-4`,
  "5": `${ticketData.id}-5`,
  "6": `${ticketData.id}-6`,
};

export const useShowsStore = create<ShowsState>((set) => ({
  shows: [],
  selectedShowId: null,
  isLoading: false,
  setShows: (shows: Show[]) => set({ shows }),
  selectShow: (id: string) => set({ selectedShowId: id }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  getTicketIdFromShowId: (showId: string) => {
    return (
      showToTicketMap[showId as keyof typeof showToTicketMap] || ticketData.id
    );
  },
}));
