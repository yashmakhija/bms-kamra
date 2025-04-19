import { create } from "zustand";
import {
  apiClient,
  CategoryCreateInput,
  EventCreateInput,
  PriceTierCreateInput,
  SeatSectionCreateInput,
  Show,
  ShowCreateInput,
  ShowtimeCreateInput,
} from "@repo/api-client";

export type WizardStep =
  | "show-details"
  | "events"
  | "showtimes"
  | "categories"
  | "price-tiers"
  | "seat-sections"
  | "publish";

export interface PriceTierCreateData {
  showId: string;
  categoryId: string;
  price: number;
  currency: string;
  description: string;
  capacity: number;
}

interface WizardState {
  // Navigation
  currentStep: WizardStep;
  goToStep: (step: WizardStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => boolean;
  isFirstStep: () => boolean;
  isLastStep: () => boolean;

  // Data
  createdShowId: string | null;
  createdEventIds: string[];
  createdShowtimeIds: string[];
  createdCategoryIds: string[];
  createdPriceTierIds: string[];
  show: Show | null;

  // Status
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;

  // Actions
  createShow: (data: ShowCreateInput) => Promise<boolean>;
  createEvent: (data: EventCreateInput) => Promise<boolean>;
  createShowtime: (data: ShowtimeCreateInput) => Promise<boolean>;
  createCategory: (data: CategoryCreateInput) => Promise<boolean>;
  createPriceTier: (data: PriceTierCreateData) => Promise<boolean>;
  createSeatSection: (data: SeatSectionCreateInput) => Promise<boolean>;
  publishShow: () => Promise<boolean>;

  // Reset wizard
  resetWizard: () => void;
  setError: (error: string | null) => void;
  updateShowDetails: (data: Partial<ShowCreateInput>) => Promise<boolean>;
}

const WIZARD_STEPS: WizardStep[] = [
  "show-details",
  "events",
  "showtimes",
  "categories",
  "price-tiers",
  "seat-sections",
  "publish",
];

export const useShowWizardStore = create<WizardState>((set, get) => ({
  // Initial state
  currentStep: "show-details",
  createdShowId: null,
  createdEventIds: [],
  createdShowtimeIds: [],
  createdCategoryIds: [],
  createdPriceTierIds: [],
  isLoading: false,
  error: null,
  isComplete: false,
  show: null,

  // Navigation methods
  goToStep: (step) => set({ currentStep: step }),

  goToNextStep: () => {
    const { currentStep } = get();
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    if (currentIndex < WIZARD_STEPS.length - 1) {
      set({ currentStep: WIZARD_STEPS[currentIndex + 1] });
      return true;
    }
    return false;
  },

  goToPreviousStep: () => {
    const { currentStep } = get();
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: WIZARD_STEPS[currentIndex - 1] });
      return true;
    }
    return false;
  },

  isFirstStep: () => {
    const { currentStep } = get();
    return currentStep === WIZARD_STEPS[0];
  },

  isLastStep: () => {
    const { currentStep } = get();
    return currentStep === WIZARD_STEPS[WIZARD_STEPS.length - 1];
  },

  // Action methods
  createShow: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const show = await apiClient.createShow(data);
      set({
        createdShowId: show.id,
        show,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create show",
        isLoading: false,
      });
      return false;
    }
  },

  updateShowDetails: async (data) => {
    set({ isLoading: true, error: null });
    const { createdShowId } = get();

    if (!createdShowId) {
      set({
        error: "No show found to update",
        isLoading: false,
      });
      return false;
    }

    try {
      const updatedShow = await apiClient.updateShow(createdShowId, data);
      set({
        show: updatedShow,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update show details",
        isLoading: false,
      });
      return false;
    }
  },

  createEvent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const event = await apiClient.createEvent(data);
      set((state) => ({
        createdEventIds: [...state.createdEventIds, event.id],
        isLoading: false,
      }));
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create event",
        isLoading: false,
      });
      return false;
    }
  },

  createShowtime: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const showtime = await apiClient.createShowtime(data);
      set((state) => ({
        createdShowtimeIds: [...state.createdShowtimeIds, showtime.id],
        isLoading: false,
      }));
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create showtime",
        isLoading: false,
      });
      return false;
    }
  },

  createCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const category = await apiClient.createCategory(data);
      set((state) => ({
        createdCategoryIds: [...state.createdCategoryIds, category.id],
        isLoading: false,
      }));
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create category",
        isLoading: false,
      });
      return false;
    }
  },

  createPriceTier: async (data: PriceTierCreateData) => {
    set({ isLoading: true, error: null });

    try {
      console.log("Creating price tier with data:", data);

      const priceTier = await apiClient.createPriceTier({
        showId: data.showId,
        categoryId: data.categoryId,
        price: data.price,
        currency: data.currency,
        description: data.description,
        capacity: data.capacity,
      });

      console.log("Created price tier:", priceTier);

      set((state) => ({
        createdPriceTierIds: [...state.createdPriceTierIds, priceTier.id],
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error("Error creating price tier:", error);

      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create price tier",
      });

      return false;
    }
  },

  createSeatSection: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.createSeatSection(data);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create seat section",
        isLoading: false,
      });
      return false;
    }
  },

  publishShow: async () => {
    set({ isLoading: true, error: null });
    try {
      const { createdShowId } = get();
      if (!createdShowId) {
        set({
          error: "No show found to publish",
          isLoading: false,
        });
        return false;
      }

      // Use a type assertion to bypass TypeScript's type checking
      await apiClient.updateShow(createdShowId, {
        // We're bypassing the TypeScript type checking here
        // because we know the API supports this property
        isActive: true,
      } as any);

      set({ isLoading: false, isComplete: true });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to publish show",
        isLoading: false,
      });
      return false;
    }
  },

  // Reset the wizard state
  resetWizard: () =>
    set({
      currentStep: "show-details",
      createdShowId: null,
      createdEventIds: [],
      createdShowtimeIds: [],
      createdCategoryIds: [],
      createdPriceTierIds: [],
      show: null,
      isLoading: false,
      error: null,
      isComplete: false,
    }),

  setError: (error) => set({ error }),
}));
