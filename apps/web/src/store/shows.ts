import { create } from "zustand";

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
}

export const useShowsStore = create<ShowsState>((set: any) => ({
  shows: [],
  selectedShowId: null,
  isLoading: false,
  setShows: (shows: Show[]) => set({ shows }),
  selectShow: (id: string) => set({ selectedShowId: id }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
