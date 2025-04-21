"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  WizardStepId,
  ShowDetails,
  Event,
  PriceTier,
  SeatSection,
  Showtime,
} from "../components/wizard/types";

// Define a Show type that combines all the individual parts
interface Show {
  details: ShowDetails;
  events: Event[];
  priceTiers: PriceTier[];
  seatSections: SeatSection[];
  showtimes: Showtime[];
}

interface WizardState {
  // Navigation
  currentStepId: WizardStepId;
  completedSteps: WizardStepId[];
  isLoading: boolean;
  error: string | null;

  // Show data
  showDetails: ShowDetails;
  events: Event[];
  priceTiers: PriceTier[];
  seatSections: SeatSection[];
  showtimes: Showtime[];

  // Actions
  setCurrentStep: (step: WizardStepId) => void;
  markStepCompleted: (step: WizardStepId) => void;
  markStepIncomplete: (step: WizardStepId) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Data actions
  updateShowDetails: (details: Partial<ShowDetails>) => void;
  setShowId: (id: string) => void;
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  removeEvent: (eventId: string) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  setPricingTiers: (tiers: PriceTier[]) => void;
  addPricingTier: (tier: PriceTier) => void;
  removePricingTier: (tierId: string) => void;
  updatePricingTier: (tierId: string, updates: Partial<PriceTier>) => void;
  setSeatingSections: (sections: SeatSection[]) => void;
  addSeatingSection: (section: SeatSection) => void;
  removeSeatingSection: (sectionId: string) => void;
  updateSeatingSection: (
    sectionId: string,
    updates: Partial<SeatSection>
  ) => void;
  addShowtime: (showtime: Showtime) => void;

  // Reset and submit
  resetWizard: () => void;
  getCompleteShow: () => Show;

  // New fields
  showId: string;
}

const initialShowDetails: ShowDetails = {
  name: "",
  description: "",
  venue: "",
  coverImage: "",
  bannerImage: "",
  category: "",
  tags: [],
  duration: 120,
  isPublic: false,
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentStepId: "details",
      completedSteps: [],
      isLoading: false,
      error: null,

      // Show data
      showDetails: initialShowDetails,
      events: [],
      priceTiers: [],
      seatSections: [],
      showtimes: [],

      // Actions
      setCurrentStep: (step) => set({ currentStepId: step }),

      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),

      markStepIncomplete: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.filter((s) => s !== step),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      // Data actions
      updateShowDetails: (details) =>
        set((state) => ({
          showDetails: { ...state.showDetails, ...details },
        })),

      setShowId: (id: string) => {
        set(() => ({
          showId: id,
        }));
      },

      setEvents: (events) => set({ events }),

      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, event],
        })),

      removeEvent: (eventId) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== eventId),
        })),

      updateEvent: (eventId, updates) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId ? { ...event, ...updates } : event
          ),
        })),

      setPricingTiers: (tiers) => set({ priceTiers: tiers }),

      addPricingTier: (tier) =>
        set((state) => ({
          priceTiers: [...state.priceTiers, tier],
        })),

      removePricingTier: (tierId) =>
        set((state) => ({
          priceTiers: state.priceTiers.filter((tier) => tier.id !== tierId),
        })),

      updatePricingTier: (tierId, updates) =>
        set((state) => ({
          priceTiers: state.priceTiers.map((tier) =>
            tier.id === tierId ? { ...tier, ...updates } : tier
          ),
        })),

      setSeatingSections: (sections) => set({ seatSections: sections }),

      addSeatingSection: (section) =>
        set((state) => ({
          seatSections: [...state.seatSections, section],
        })),

      removeSeatingSection: (sectionId) =>
        set((state) => ({
          seatSections: state.seatSections.filter(
            (section) => section.id !== sectionId
          ),
        })),

      updateSeatingSection: (sectionId, updates) =>
        set((state) => ({
          seatSections: state.seatSections.map((section) =>
            section.id === sectionId ? { ...section, ...updates } : section
          ),
        })),

      addShowtime: (showtime) =>
        set((state) => ({
          showtimes: [...state.showtimes, showtime],
        })),

      // Reset and submit
      resetWizard: () =>
        set({
          currentStepId: "details",
          completedSteps: [],
          error: null,
          showDetails: initialShowDetails,
          events: [],
          priceTiers: [],
          seatSections: [],
          showtimes: [],
        }),

      getCompleteShow: () => {
        const { showDetails, events, priceTiers, seatSections, showtimes } =
          get();
        return {
          details: showDetails,
          events,
          priceTiers,
          seatSections,
          showtimes,
        };
      },

      // New fields
      showId: "",
    }),
    {
      name: "show-wizard",
    }
  )
);
