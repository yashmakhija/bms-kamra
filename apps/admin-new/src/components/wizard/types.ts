/**
 * Types for the Show Creation Wizard
 */

// Step IDs for the wizard
export type WizardStepId =
  | "details"
  | "pricing"
  | "events"
  | "showtimes"
  | "seating"
  | "review";

// Wizard state interface
export interface WizardState {
  // Current step and tracking
  currentStepId: WizardStepId;
  completedSteps: WizardStepId[];

  // API IDs for created entities
  showId: string;
  eventIds: string[];
  showtimeIds: string[];
  priceTierIds: string[];
  seatSectionIds: string[];

  // UI state
  isLoading: boolean;
  error: string | null;
  isPublished: boolean;
}

// Show details form data
export interface ShowDetailsFormData {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  venueId: string;
  duration: number;
  ageLimit: string;
  language: string;
}

// Event data
export interface EventData {
  id: string;
  date: Date;
  isActive: boolean;
}

// Showtime data
export interface ShowtimeData {
  id: string;
  eventId: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// Price tier data
export interface PriceTierData {
  id?: string;
  categoryType: string;
  categoryId?: string;
  price: number;
  currency: string;
  description: string;
  capacity: number;
}

// Seat section data
export interface SeatSectionData {
  id?: string;
  name: string;
  showtimeId: string;
  priceTierId: string;
  capacity: number;
  availableSeats: number;
}

// Component props for each step
export interface StepProps {
  isEnabled: boolean;
}

export interface ShowDetailsStepProps extends StepProps {
  onComplete: (showId: string) => void;
}

export interface EventsStepProps extends StepProps {
  showId: string;
  onComplete: (eventIds: string[]) => void;
}

export interface ShowtimesStepProps extends StepProps {
  showId: string;
  eventIds: string[];
  onComplete: (showtimeIds: string[]) => void;
}

export interface PricingStepProps extends StepProps {
  showId: string;
  onComplete: (priceTierIds: string[]) => void;
}

export interface SeatingStepProps extends StepProps {
  showtimeIds: string[];
  priceTierIds: string[];
  onComplete: (seatSectionIds: string[]) => void;
}

export interface ReviewStepProps extends StepProps {
  showId: string;
  eventIds: string[];
  showtimeIds: string[];
  priceTierIds: string[];
  seatSectionIds: string[];
  onPublish: () => void;
}

// Show details form state
export interface ShowDetails {
  name: string;
  description: string;
  venue: string;
  coverImage?: string;
  bannerImage?: string;
  category?: string;
  tags?: string[];
  duration?: number; // in minutes
  isPublic: boolean;
}

// Event details
export interface Event {
  id: string;
  date: string; // ISO string
  showId: string;
  name?: string;
}

// Showtime details
export interface Showtime {
  id: string;
  eventId: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  isPublic: boolean;
}

// Price tier details
export interface PriceTier {
  id: string;
  showId: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  color?: string;
}

// Seating section details
export interface SeatSection {
  id: string;
  showId: string;
  name: string;
  capacity: number;
  priceTierId?: string;
  rows?: number;
  columns?: number;
  color?: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Form validation
export interface ValidationState {
  [key: string]: {
    isValid: boolean;
    message?: string;
  };
}

// Step completion criteria
export interface StepCompletionCriteria {
  details: (state: ShowDetails) => boolean;
  events: (eventIds: string[]) => boolean;
  showtimes: (showtimeIds: string[]) => boolean;
  pricing: (priceTierIds: string[]) => boolean;
  seating: (seatSectionIds: string[]) => boolean;
  review: () => boolean;
}
