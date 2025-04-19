import { create } from "zustand";
import { Ticket, ticketData } from "../components/ticket/ticket";

// Generate multiple ticket variations using the same base data
const ticketsCollection: Record<string, Ticket> = {};

// Create original ticket
ticketsCollection[ticketData.id] = ticketData;

// Create 6 variations with different IDs
for (let i = 1; i <= 6; i++) {
  const ticketId = `${ticketData.id}-${i}`;
  ticketsCollection[ticketId] = {
    ...ticketData,
    id: ticketId,
    // Slightly modify some properties to make each unique
    price: {
      currency: "₹",
      amount: 1000 * (i + 2), // Different price for each ticket
    },
    venue: i % 2 === 0 ? ticketData.venue : "COMEDY CLUB, DUBAI",
  };
}

interface TicketState {
  ticket: Ticket | null;
  isLoading: boolean;
  hasError: boolean;
  loadTicket: (ticketId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (hasError: boolean) => void;
}

export const useTicketStore = create<TicketState>((set) => ({
  ticket: null,
  isLoading: false,
  hasError: false,

  loadTicket: (ticketId: string) => {
    set({ isLoading: true, hasError: false });

    // Simulate API call delay
    setTimeout(() => {
      const foundTicket = ticketsCollection[ticketId];
      if (foundTicket) {
        set({ ticket: foundTicket, isLoading: false });
      } else {
        set({ hasError: true, isLoading: false });
      }
    }, 500);
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (hasError: boolean) => set({ hasError }),
}));
