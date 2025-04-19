import { create } from "zustand";

export interface DashboardMetric {
  title: string;
  value: string | number;
  change: number;
}

export interface BookingStatusCount {
  status: string;
  count: number;
  color: string;
}

export interface RecentShow {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  ticketsSold: number;
  revenue: string;
}

export interface EventFormData {
  title: string;
  date: string;
  time: string;
  venue: string;
  price: number;
  description: string;
}

interface DashboardState {
  metrics: DashboardMetric[];
  bookingStatuses: BookingStatusCount[];
  recentShows: RecentShow[];
  isLoading: boolean;
  isCreatingEvent: boolean;
  error: string | null;
  fetchDashboardData: () => void;
  createEvent: (eventData: EventFormData) => Promise<boolean>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  metrics: [],
  bookingStatuses: [],
  recentShows: [],
  isLoading: false,
  isCreatingEvent: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });

    try {
      // In a real app, this would be an API call
      // Simulating API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const metrics: DashboardMetric[] = [
        {
          title: "Total Revenue",
          value: "₹458,500",
          change: 12.5,
        },
        {
          title: "Total Shows",
          value: 24,
          change: 8.2,
        },
        {
          title: "Tickets Sold",
          value: 3240,
          change: 14.6,
        },
        {
          title: "Conversion Rate",
          value: "68.2%",
          change: -2.4,
        },
      ];

      const bookingStatuses: BookingStatusCount[] = [
        { status: "Booked", count: 2450, color: "bg-emerald-500" },
        { status: "Pending", count: 840, color: "bg-amber-500" },
        { status: "Cancelled", count: 320, color: "bg-rose-500" },
      ];

      const recentShows: RecentShow[] = [
        {
          id: "1",
          title: "Comedy Night with Kunal",
          date: "2023-08-15",
          time: "8:00 PM",
          venue: "Comedy Club Mumbai",
          ticketsSold: 450,
          revenue: "₹225,000",
        },
        {
          id: "2",
          title: "Kunal Kamra Live",
          date: "2023-08-10",
          time: "7:30 PM",
          venue: "Town Hall Delhi",
          ticketsSold: 380,
          revenue: "₹190,000",
        },
        {
          id: "3",
          title: "Political Comedy Special",
          date: "2023-08-05",
          time: "8:30 PM",
          venue: "Laugh Factory Bangalore",
          ticketsSold: 290,
          revenue: "₹145,000",
        },
      ];

      set({ metrics, bookingStatuses, recentShows, isLoading: false });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      set({ error: "Failed to load dashboard data", isLoading: false });
    }
  },

  createEvent: async (eventData: EventFormData) => {
    set({ isCreatingEvent: true, error: null });

    try {
      // In a real app, this would be an API call to create the event
      console.log("Creating event with data:", eventData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update our local data with the new event
      const newEventId = Date.now().toString();

      // In a real implementation, we would get the new ID from the API response
      const newEvent: RecentShow = {
        id: newEventId,
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        ticketsSold: 0,
        revenue: "₹0",
      };

      // Add the new event to the recent shows list
      const currentShows = get().recentShows;
      set({
        recentShows: [newEvent, ...currentShows].slice(0, 10),
        isCreatingEvent: false,
      });

      // Update the metrics to reflect new event count
      const currentMetrics = get().metrics;
      const updatedMetrics = currentMetrics.map((metric) => {
        if (metric.title === "Total Shows") {
          const currentValue =
            typeof metric.value === "number" ? metric.value : 0;
          return { ...metric, value: currentValue + 1 };
        }
        return metric;
      });

      set({ metrics: updatedMetrics });

      return true;
    } catch (error) {
      console.error("Error creating event:", error);
      set({
        error: "Failed to create event. Please try again.",
        isCreatingEvent: false,
      });
      return false;
    }
  },
}));
