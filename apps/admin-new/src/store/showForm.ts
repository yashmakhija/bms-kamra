import { create } from "zustand";

// Define the show details interface
export interface ShowDetails {
  title: string;
  subtitle: string;
  description: string;
  venueId: string;
  duration: number;
  ageLimit: string;
  language: string;
  imageUrl: string;
  thumbnailUrl: string;
}

// Define the initial state
const initialShowDetails: ShowDetails = {
  title: "",
  subtitle: "",
  description: "",
  venueId: "",
  duration: 120,
  ageLimit: "18+",
  language: "English/Hindi",
  imageUrl: "",
  thumbnailUrl: "",
};

// Define the store interface
interface ShowFormState {
  // Show details
  showDetails: ShowDetails;
  // Form state
  isValid: boolean;
  dirtyFields: Set<string>;
  // Actions
  updateField: (field: keyof ShowDetails, value: any) => void;
  updateShowDetails: (details: Partial<ShowDetails>) => void;
  setIsValid: (isValid: boolean) => void;
  markFieldAsDirty: (field: keyof ShowDetails) => void;
  resetForm: () => void;
}

// Create the store
export const useShowFormStore = create<ShowFormState>((set) => ({
  showDetails: initialShowDetails,
  isValid: false,
  dirtyFields: new Set<string>(),

  // Update a single field
  updateField: (field, value) =>
    set((state) => ({
      showDetails: {
        ...state.showDetails,
        [field]: value,
      },
    })),

  // Update multiple fields
  updateShowDetails: (details) =>
    set((state) => ({
      showDetails: {
        ...state.showDetails,
        ...details,
      },
    })),

  // Set form validity
  setIsValid: (isValid) => set({ isValid }),

  // Mark a field as dirty (modified)
  markFieldAsDirty: (field) =>
    set((state) => ({
      dirtyFields: new Set([...state.dirtyFields, field]),
    })),

  // Reset the form to initial state
  resetForm: () =>
    set({
      showDetails: initialShowDetails,
      isValid: false,
      dirtyFields: new Set<string>(),
    }),
}));
