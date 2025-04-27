import {
  Event,
  PriceTier,
  SeatSection,
  Show,
  Showtime,
  Venue,
} from "@repo/database";

// Create a mock venue
export const createMockVenue = (): Venue => {
  return {
    id: `venue-${Date.now()}`,
    name: "Test Venue",
    address: "123 Test Street",
    city: "Test City",
    country: "Test Country",
    capacity: 1000,
    description: "A test venue",
    imageUrl: "https://example.com/venue.jpg",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Create a mock show
export const createMockShow = (venueId: string): Show => {
  return {
    id: `show-${Date.now()}`,
    title: "Test Show",
    subtitle: "A Spectacular Experience",
    description: "This is a test show",
    imageUrl: "https://example.com/show.jpg",
    thumbnailUrl: "https://example.com/show-thumb.jpg",
    duration: 120,
    ageLimit: "18+",
    language: "English",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    venueId,
  };
};

// Create a mock event
export const createMockEvent = (showId: string): Event => {
  return {
    id: `event-${Date.now()}`,
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    showId,
  };
};

// Create a mock showtime
export const createMockShowtime = (eventId: string): Showtime => {
  const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // Day after tomorrow
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  return {
    id: `showtime-${Date.now()}`,
    startTime,
    endTime,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    eventId,
  };
};

// Create a mock price tier
export const createMockPriceTier = (
  showId: string,
  categoryId: string
): PriceTier => {
  return {
    id: `pricetier-${Date.now()}`,
    capacity: 100,
    price: 50.0 as any,
    currency: "USD",
    description: "Regular seating",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    showId,
    categoryId,
  };
};

// Create a mock seat section
export const createMockSeatSection = (
  showtimeId: string,
  priceTierId: string
): SeatSection => {
  return {
    id: `section-${Date.now()}`,
    name: "Section A",
    availableSeats: 50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    showtimeId,
    priceTierId,
  };
};
