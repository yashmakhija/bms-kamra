import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WizardState, WizardStepId } from "./types";

// Define the ordered steps of the wizard
export const WIZARD_STEPS: WizardStepId[] = [
  "details",
  "events",
  "showtimes",
  "pricing",
  "seating",
  "review",
];

// Wizard store actions
interface WizardActions {
  // Navigation
  goToStep: (stepId: WizardStepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  markStepComplete: (stepId: WizardStepId) => void;

  // Entity management
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

  // UI state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Lifecycle
  markAsPublished: () => void;
  resetWizard: () => void;

  // Validation
  canProceedFromStep: (stepId: WizardStepId) => boolean;
}

// Initial state
const initialState: WizardState = {
  currentStepId: "details",
  completedSteps: [],
  showId: "",
  eventIds: [],
  showtimeIds: [],
  priceTierIds: [],
  seatSectionIds: [],
  isLoading: false,
  error: null,
  isPublished: false,
};

// Create the store
export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Navigation
      goToStep: (stepId) => set({ currentStepId: stepId }),

      nextStep: () => {
        const { currentStepId } = get();
        const currentIndex = WIZARD_STEPS.indexOf(currentStepId);

        if (currentIndex < WIZARD_STEPS.length - 1) {
          set({ currentStepId: WIZARD_STEPS[currentIndex + 1] });
        }
      },

      prevStep: () => {
        const { currentStepId } = get();
        const currentIndex = WIZARD_STEPS.indexOf(currentStepId);

        if (currentIndex > 0) {
          set({ currentStepId: WIZARD_STEPS[currentIndex - 1] });
        }
      },

      markStepComplete: (stepId) => {
        set((state) => {
          if (state.completedSteps.includes(stepId)) {
            return state;
          }

          return {
            completedSteps: [...state.completedSteps, stepId],
          };
        });
      },

      // Entity management
      setShowId: (id) => set({ showId: id }),

      setEventIds: (ids) => set({ eventIds: ids }),

      addEventId: (id) =>
        set((state) => ({
          eventIds: [...state.eventIds, id],
        })),

      removeEventId: (id) =>
        set((state) => ({
          eventIds: state.eventIds.filter((eventId) => eventId !== id),
        })),

      setShowtimeIds: (ids) => set({ showtimeIds: ids }),

      addShowtimeId: (id) =>
        set((state) => ({
          showtimeIds: [...state.showtimeIds, id],
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
          priceTierIds: [...state.priceTierIds, id],
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
          seatSectionIds: [...state.seatSectionIds, id],
        })),

      removeSeatSectionId: (id) =>
        set((state) => ({
          seatSectionIds: state.seatSectionIds.filter(
            (seatSectionId) => seatSectionId !== id
          ),
        })),

      // UI state
      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      // Lifecycle
      markAsPublished: () => set({ isPublished: true }),

      resetWizard: () => set(initialState),

      // Validation
      canProceedFromStep: (stepId) => {
        const state = get();

        switch (stepId) {
          case "details":
            return state.showId !== "";
          case "events":
            return state.eventIds.length > 0;
          case "showtimes":
            return state.showtimeIds.length > 0;
          case "pricing":
            return state.priceTierIds.length > 0;
          case "seating":
            return state.seatSectionIds.length > 0;
          case "review":
            return true;
          default:
            return false;
        }
      },
    }),
    {
      name: "show-wizard-store",
    }
  )
);

// Selector for accessing the current step
export const useCurrentStep = () =>
  useWizardStore((state) => state.currentStepId);

// Selector for checking if a step is completed
export const useIsStepCompleted = (stepId: WizardStepId) =>
  useWizardStore((state) => state.completedSteps.includes(stepId));

// Selector for checking if a step can proceed
export const useCanProceedFromStep = (stepId: WizardStepId) =>
  useWizardStore((state) => state.canProceedFromStep(stepId));
