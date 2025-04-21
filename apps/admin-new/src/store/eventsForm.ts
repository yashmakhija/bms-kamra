import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Event {
  id: string;
  date: Date;
  isActive: boolean;
}

export interface EventsFormState {
  // State
  events: Event[];
  selectedDate: Date | null;
  isDialogOpen: boolean;
}

export interface EventsFormActions {
  // Actions
  setEvents: (events: Event[]) => void;
  addEvent: (date: Date) => Event | null;
  removeEvent: (id: string) => void;
  setSelectedDate: (date: Date | null) => void;
  setDialogOpen: (isOpen: boolean) => void;
  openDialog: () => void;
  closeDialog: () => void;
  clearEvents: () => void;
}

export const useEventsFormStore = create<EventsFormState & EventsFormActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      events: [],
      selectedDate: null,
      isDialogOpen: false,

      // Actions
      setEvents: (events) => set({ events }),

      addEvent: (date) => {
        if (!date) return null;

        const newEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date,
          isActive: true,
        };

        set((state) => ({
          events: [...state.events, newEvent],
          selectedDate: null,
          isDialogOpen: false,
        }));

        return newEvent;
      },

      removeEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        })),

      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      setDialogOpen: (isOpen) => {
        set({
          isDialogOpen: isOpen,
          // If we're closing the dialog without selecting a date, reset the selected date
          ...(isOpen === false && {
            selectedDate: null,
          }),
        });
      },

      openDialog: () => {
        set({
          selectedDate: null,
          isDialogOpen: true,
        });
      },

      closeDialog: () => {
        set({
          isDialogOpen: false,
          selectedDate: null,
        });
      },

      clearEvents: () => {
        set({
          events: [],
          selectedDate: null,
          isDialogOpen: false,
        });
      },
    }),
    { name: "events-form-store" }
  )
);
