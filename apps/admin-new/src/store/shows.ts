import { create } from "zustand";
import { apiClient } from "@repo/api-client";
import type { Show, ShowCreateInput } from "@repo/api-client";

interface ShowsState {
  shows: Show[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  fetchShows: () => Promise<void>;
  fetchShowById: (id: string) => Promise<Show | null>;
  createShow: (data: ShowCreateInput) => Promise<Show | null>;
  updateShow: (
    id: string,
    data: Partial<ShowCreateInput>
  ) => Promise<Show | null>;
  deleteShow: (id: string) => Promise<boolean>;
}

export const useShowsStore = create<ShowsState>((set, get) => ({
  shows: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,

  fetchShows: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.getAllShows(1, 100); // Get first 100 shows
      set({ shows: response.shows, isLoading: false });
    } catch (error) {
      console.error("Error fetching shows:", error);
      set({
        error: "Failed to fetch shows. Please try again.",
        isLoading: false,
        shows: [], // Reset shows on error
      });
    }
  },

  fetchShowById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const show = await apiClient.getShowById(id);
      set({ isLoading: false });
      return show;
    } catch (error) {
      console.error(`Error fetching show ${id}:`, error);
      set({
        error: `Failed to fetch show details. Please try again.`,
        isLoading: false,
      });
      return null;
    }
  },

  createShow: async (data: ShowCreateInput) => {
    set({ isCreating: true, error: null });

    try {
      const newShow = await apiClient.createShow(data);

      // Update the local state with the new show
      set((state) => ({
        shows: [...state.shows, newShow],
        isCreating: false,
      }));

      return newShow;
    } catch (error) {
      console.error("Error creating show:", error);
      set({
        error: "Failed to create show. Please try again.",
        isCreating: false,
      });
      return null;
    }
  },

  updateShow: async (id: string, data: Partial<ShowCreateInput>) => {
    set({ isUpdating: true, error: null });

    try {
      const updatedShow = await apiClient.updateShow(id, data);

      // Update the show in the local state
      set((state) => ({
        shows: state.shows.map((show) => (show.id === id ? updatedShow : show)),
        isUpdating: false,
      }));

      return updatedShow;
    } catch (error) {
      console.error(`Error updating show ${id}:`, error);
      set({
        error: "Failed to update show. Please try again.",
        isUpdating: false,
      });
      return null;
    }
  },

  deleteShow: async (id: string) => {
    set({ isDeleting: true, error: null });

    try {
      await apiClient.deleteShow(id);

      // Remove the show from the local state
      set((state) => ({
        shows: state.shows.filter((show) => show.id !== id),
        isDeleting: false,
      }));

      return true;
    } catch (error) {
      console.error(`Error deleting show ${id}:`, error);
      set({
        error: "Failed to delete show. Please try again.",
        isDeleting: false,
      });
      return false;
    }
  },
}));
