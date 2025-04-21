"use client";

import { create } from "zustand";
import { WizardStepId } from "@/components/wizard/types";

interface WizardState {
  // Navigation
  currentStepId: WizardStepId;
  completedSteps: WizardStepId[];

  // IDs of created entities
  showId: string | null;
  eventIds: string[];
  showtimeIds: string[];
  priceTierIds: string[];
  seatSectionIds: string[];

  // UI state
  isLoading: boolean;
  error: string | null;
  dirty: boolean;
}

interface WizardActions {
  // Navigation actions
  setCurrentStep: (stepId: WizardStepId) => void;
  markStepAsCompleted: (stepId: WizardStepId) => void;
  resetCompletedSteps: () => void;

  // Entity ID management
  setShowId: (id: string) => void;
  setEventIds: (ids: string[]) => void;
  addEventId: (id: string) => void;
  removeEventId: (id: string) => void;
  setShowtimeIds: (ids: string[]) => void;
  addShowtimeId: (id: string) => void;
  removeShowtimeId: (id: string) => void;
  setPriceTierIds: (ids: string[]) => void;
  addPriceTierId: (id: string) => void;
  removePriceTierId: (id: string) => void;
  setSeatSectionIds: (ids: string[]) => void;
  addSeatSectionId: (id: string) => void;
  removeSeatSectionId: (id: string) => void;

  // UI state management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setDirty: (dirty: boolean) => void;

  // Wizard flow
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoToNextStep: () => boolean;
  canGoToPreviousStep: () => boolean;
  reset: () => void;
}

// Define the step order for navigation
const stepOrder: WizardStepId[] = [
  "details",
  "events",
  "showtimes",
  "pricing",
  "seating",
  "review",
];

const initialState: WizardState = {
  currentStepId: "details",
  completedSteps: [],
  showId: null,
  eventIds: [],
  showtimeIds: [],
  priceTierIds: [],
  seatSectionIds: [],
  isLoading: false,
  error: null,
  dirty: false,
};

export const useWizardStore = create<WizardState & WizardActions>(
  (set, get) => ({
    ...initialState,

    // Navigation actions
    setCurrentStep: (stepId) => set({ currentStepId: stepId }),

    markStepAsCompleted: (stepId) =>
      set((state) => ({
        completedSteps: state.completedSteps.includes(stepId)
          ? state.completedSteps
          : [...state.completedSteps, stepId],
      })),

    resetCompletedSteps: () => set({ completedSteps: [] }),

    // Entity ID management
    setShowId: (id) => set({ showId: id }),

    setEventIds: (ids) => set({ eventIds: ids }),

    addEventId: (id) =>
      set((state) => ({
        eventIds: state.eventIds.includes(id)
          ? state.eventIds
          : [...state.eventIds, id],
      })),

    removeEventId: (id) =>
      set((state) => ({
        eventIds: state.eventIds.filter((eventId) => eventId !== id),
      })),

    setShowtimeIds: (ids) => set({ showtimeIds: ids }),

    addShowtimeId: (id) =>
      set((state) => ({
        showtimeIds: state.showtimeIds.includes(id)
          ? state.showtimeIds
          : [...state.showtimeIds, id],
      })),

    removeShowtimeId: (id) =>
      set((state) => ({
        showtimeIds: state.showtimeIds.filter(
          (showtimeId) => showtimeId !== id
        ),
      })),

    setPriceTierIds: (ids) => set({ priceTierIds: ids }),

    addPriceTierId: (id) =>
      set((state) => ({
        priceTierIds: state.priceTierIds.includes(id)
          ? state.priceTierIds
          : [...state.priceTierIds, id],
      })),

    removePriceTierId: (id) =>
      set((state) => ({
        priceTierIds: state.priceTierIds.filter(
          (priceTierId) => priceTierId !== id
        ),
      })),

    setSeatSectionIds: (ids) => set({ seatSectionIds: ids }),

    addSeatSectionId: (id) =>
      set((state) => ({
        seatSectionIds: state.seatSectionIds.includes(id)
          ? state.seatSectionIds
          : [...state.seatSectionIds, id],
      })),

    removeSeatSectionId: (id) =>
      set((state) => ({
        seatSectionIds: state.seatSectionIds.filter(
          (seatSectionId) => seatSectionId !== id
        ),
      })),

    // UI state management
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setDirty: (dirty) => set({ dirty }),

    // Wizard flow
    goToNextStep: () => {
      const { currentStepId } = get();
      const currentIndex = stepOrder.indexOf(currentStepId);

      if (currentIndex < stepOrder.length - 1) {
        set({ currentStepId: stepOrder[currentIndex + 1] });
      }
    },

    goToPreviousStep: () => {
      const { currentStepId } = get();
      const currentIndex = stepOrder.indexOf(currentStepId);

      if (currentIndex > 0) {
        set({ currentStepId: stepOrder[currentIndex - 1] });
      }
    },

    canGoToNextStep: () => {
      const { currentStepId } = get();
      const currentIndex = stepOrder.indexOf(currentStepId);
      return currentIndex < stepOrder.length - 1;
    },

    canGoToPreviousStep: () => {
      const { currentStepId } = get();
      const currentIndex = stepOrder.indexOf(currentStepId);
      return currentIndex > 0;
    },

    reset: () => set(initialState),
  })
);
