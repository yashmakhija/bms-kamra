"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { StepNavigation } from "./WizardLayout";
import { apiClient } from "@repo/api-client";
import { Showtime, PriceTier } from "@repo/api-client";

interface SeatSectionForm {
  showtimeId: string;
  priceTierId: string;
  name: string;
  totalSeats: number;
  availableSeats: number;
}

interface SeatSectionWithId extends SeatSectionForm {
  id?: string;
  isNew?: boolean;
}

export function SeatingStep() {
  const {
    showId,
    priceTiers,
    seatSections: storeSeatSections,
    addSeatingSection,
    removeSeatingSection,
    markStepCompleted,
    setCurrentStep,
    setLoading: setGlobalLoading,
    setError: setGlobalError,
    events,
    showtimes: storeShowtimes,
  } = useWizardStore();

  const [form, setForm] = useState<SeatSectionForm>({
    showtimeId: "",
    priceTierId: "",
    name: "",
    totalSeats: 100,
    availableSeats: 100,
  });

  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [availablePriceTiers, setAvailablePriceTiers] = useState<PriceTier[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seatSections, setSeatSections] = useState<SeatSectionWithId[]>([]);

  // Load showtimes and price tiers
  useEffect(() => {
    if (!showId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Loading data for show ID: ${showId}`);

        // Get events from the wizard store
        const eventsList = Array.isArray(events) ? events : [];
        console.log(
          `Using ${eventsList.length} events from wizard store:`,
          eventsList
        );

        // Get price tiers from the wizard store
        const storePriceTiers = Array.isArray(priceTiers) ? priceTiers : [];
        console.log(
          `Found ${storePriceTiers.length} price tiers in store:`,
          storePriceTiers
        );

        // Create a properly typed array for API price tiers
        let apiFormatPriceTiers: PriceTier[] = [];

        // If we have price tiers in the store, convert them to API format
        if (storePriceTiers.length > 0) {
          console.log("Converting price tiers from store to API format");

          // Create PriceTier objects from store data
          apiFormatPriceTiers = storePriceTiers.map((tier) => {
            console.log("Converting tier:", tier);

            // Create a properly typed PriceTier object that matches the interface
            return {
              id:
                tier.id ||
                `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              showId: tier.showId || showId,
              price: typeof tier.price === "number" ? tier.price : 0,
              currency: tier.currency || "INR",
              description: tier.description || "",
              capacity: 100, // Default capacity
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              categoryId: "",
              category: {
                id: "",
                name: tier.description || "Standard",
                type: tier.description || "Standard",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            } as PriceTier; // Use type assertion to avoid linter errors
          });

          console.log("Converted price tiers:", apiFormatPriceTiers);
          setAvailablePriceTiers(apiFormatPriceTiers);
        } else {
          // As a fallback, try fetching from API
          console.log("No price tiers in store, fetching from API...");
          try {
            const priceTiersData =
              await apiClient.getPriceTiersByShowId(showId);
            console.log("Price tiers fetched from API:", priceTiersData);
            apiFormatPriceTiers = priceTiersData || [];
            setAvailablePriceTiers(apiFormatPriceTiers);
          } catch (priceTierError) {
            console.error(
              "Error fetching price tiers from API:",
              priceTierError
            );
            setAvailablePriceTiers([]);
          }
        }

        console.log(
          `After conversion/fetching, have ${apiFormatPriceTiers.length} available price tiers`
        );

        // First check if we have showtimes in the store
        const storeShowtimesList = Array.isArray(storeShowtimes)
          ? storeShowtimes
          : [];
        console.log(
          `Found ${storeShowtimesList.length} showtimes in store:`,
          storeShowtimesList
        );

        // Initialize our showtime array with properly mapped store showtimes
        const allShowtimes: Showtime[] = storeShowtimesList.map(
          (storeShowtime) => ({
            id: storeShowtime.id,
            eventId: storeShowtime.eventId,
            startTime: new Date(storeShowtime.startTime), // Convert ISO string to Date
            endTime: storeShowtime.endTime
              ? new Date(storeShowtime.endTime)
              : new Date(), // Convert ISO string to Date with fallback
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );

        // If we don't have enough showtimes in the store, try to fetch from API as a fallback
        if (allShowtimes.length === 0) {
          console.log("No showtimes in store, attempting to fetch from API...");

          // Get all showtimes for all events
          console.log("Attempting to fetch showtimes for events...");

          // Try to fetch showtimes for each event
          for (const event of eventsList) {
            if (!event.id) {
              console.warn(`Skipping event with no ID`, event);
              continue;
            }

            try {
              console.log(`Fetching showtimes for event ID: ${event.id}`);
              const showtimesData = await apiClient.getShowtimesByEventId(
                event.id
              );
              console.log(`API response for showtimes:`, showtimesData);

              if (Array.isArray(showtimesData) && showtimesData.length > 0) {
                console.log(
                  `Found ${showtimesData.length} showtimes for event ${event.id}`
                );
                allShowtimes.push(...showtimesData);
              } else {
                console.warn(`No showtimes found for event ${event.id}`);
              }
            } catch (eventError) {
              console.error(
                `Error fetching showtimes for event ${event.id}:`,
                eventError
              );
            }
          }
        }

        console.log(`Total showtimes found: ${allShowtimes.length}`);
        setShowtimes(allShowtimes);

        // Set default form values if we have data
        if (allShowtimes.length > 0 && apiFormatPriceTiers.length > 0) {
          console.log("Setting default form values");
          setForm((prev) => ({
            ...prev,
            showtimeId: allShowtimes[0].id,
            priceTierId: apiFormatPriceTiers[0].id,
            name: `Section for ${apiFormatPriceTiers[0].category?.type || apiFormatPriceTiers[0].description || "Default Category"}`,
          }));
        } else {
          console.log("Missing data needed for form defaults:", {
            showtimes: allShowtimes.length,
            priceTiers: apiFormatPriceTiers.length,
          });
        }

        // Fetch existing seat sections for all showtimes
        console.log("Fetching seat sections for all showtimes...");
        const existingSeatSections: SeatSectionWithId[] = [];
        for (const showtime of allShowtimes) {
          try {
            console.log(
              `Fetching seat sections for showtime ID: ${showtime.id}`
            );
            const seatSectionsData =
              await apiClient.getSeatSectionsByShowtimeId(showtime.id);
            if (seatSectionsData && Array.isArray(seatSectionsData)) {
              console.log(
                `Found ${seatSectionsData.length} seat sections for showtime ${showtime.id}`
              );
              existingSeatSections.push(
                ...seatSectionsData.map((section) => ({
                  id: section.id,
                  showtimeId: section.showtimeId,
                  priceTierId: section.priceTierId,
                  name: section.name,
                  totalSeats: section.availableSeats,
                  availableSeats: section.availableSeats,
                }))
              );
            }
          } catch (sectionError) {
            console.error(
              `Error fetching seat sections for showtime ${showtime.id}:`,
              sectionError
            );
          }
        }

        console.log(
          `Total existing seat sections found: ${existingSeatSections.length}`
        );
        setSeatSections(existingSeatSections);

        // Data summary for debugging
        console.log("Data loading summary:");
        console.log(`- Events from store: ${eventsList.length}`);
        console.log(`- Price Tiers from store: ${storePriceTiers.length}`);
        console.log(`- Price Tiers available: ${apiFormatPriceTiers.length}`);
        console.log(`- Showtimes from store: ${storeShowtimesList.length}`);
        console.log(`- Showtimes total: ${allShowtimes.length}`);
        console.log(`- Seat Sections: ${existingSeatSections.length}`);

        // Show friendly error messages based on missing data
        if (eventsList.length === 0) {
          setError(
            "No events found. Please create events first in the events step."
          );
        } else if (allShowtimes.length === 0) {
          setError(
            "No showtimes found. Please create showtimes first in the showtimes step."
          );

          // Add some debugging info to help user troubleshoot
          console.warn("Possible reasons for missing showtimes:");
          console.warn("1. Showtimes were not successfully created");
          console.warn(
            "2. Event IDs in the store don't match those on the server"
          );
          console.warn(
            "3. The showtimes API endpoint is returning empty results"
          );
          console.warn(
            "4. Showtimes were not properly saved to the wizard store"
          );
        } else if (apiFormatPriceTiers.length === 0) {
          setError(
            "No price tiers found. Please create price tiers first in the pricing step."
          );
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError(
          `Failed to load data: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showId, events, priceTiers, storeShowtimes]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "totalSeats" || name === "availableSeats") {
      const numValue = parseInt(value) || 0;
      setForm({
        ...form,
        [name]: numValue <= 0 ? 1 : numValue,
        // When totalSeats changes, update availableSeats to match
        ...(name === "totalSeats"
          ? { availableSeats: numValue <= 0 ? 1 : numValue }
          : {}),
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }

    setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.showtimeId) {
      setError("Please select a showtime");
      return false;
    }

    if (!form.priceTierId) {
      setError("Please select a price tier");
      return false;
    }

    if (!form.name.trim()) {
      setError("Please enter a section name");
      return false;
    }

    if (form.totalSeats <= 0) {
      setError("Total seats must be greater than 0");
      return false;
    }

    if (form.availableSeats > form.totalSeats) {
      setError("Available seats cannot exceed total seats");
      return false;
    }

    return true;
  };

  const handleAddSeatSection = () => {
    if (!validateForm()) return;

    // Create a seat section for the wizard store
    const newSeatSection: SeatSectionWithId = {
      id: `temp-${new Date().getTime()}`,
      ...form,
      isNew: true,
    };

    // Add to local state
    setSeatSections([...seatSections, newSeatSection]);

    // Reset the form but keep the showtime and price tier
    setForm({
      ...form,
      name: "",
      totalSeats: 100,
      availableSeats: 100,
    });
  };

  const handleRemoveSeatSection = (sectionId: string) => {
    setSeatSections(seatSections.filter((section) => section.id !== sectionId));
  };

  const handleSave = async () => {
    if (seatSections.length === 0) {
      setError("Please add at least one seat section");
      return;
    }

    if (!showId) {
      setError("Show ID is required. Please complete the previous steps.");
      return;
    }

    try {
      setIsSubmitting(true);
      setGlobalLoading(true);

      // Create a new array to store saved seat sections
      const savedSectionIds: string[] = [];

      // Process each seat section
      for (const section of seatSections) {
        if (section.id && section.id.startsWith("temp-")) {
          // This is a new section, create it via API
          try {
            console.log("Creating seat section with data:", {
              showtimeId: section.showtimeId,
              priceTierId: section.priceTierId,
              name: section.name,
              availableSeats: section.totalSeats,
            });

            const seatSection = await apiClient.createSeatSection({
              showtimeId: section.showtimeId,
              priceTierId: section.priceTierId,
              name: section.name,
              availableSeats: section.totalSeats,
            });

            console.log("Successfully created seat section:", seatSection);

            savedSectionIds.push(seatSection.id);

            // Add to the wizard store
            addSeatingSection({
              id: seatSection.id,
              showId: showId,
              name: seatSection.name,
              capacity: seatSection.availableSeats,
              priceTierId: seatSection.priceTierId,
            });
          } catch (err) {
            console.error("Failed to create seat section:", err);
            setError(`Failed to create seat section: ${section.name}`);
          }
        } else if (section.id) {
          // This is an existing section, include it
          savedSectionIds.push(section.id);
        }
      }

      // Mark step as completed only if we have at least one saved section
      if (savedSectionIds.length > 0) {
        markStepCompleted("seating");

        // Move to the next step
        setCurrentStep("review");
      } else {
        setError("Failed to save any seat sections. Please try again.");
      }
    } catch (error) {
      console.error("Error saving seat sections:", error);
      setError("Failed to save seat sections. Please try again.");
      setGlobalError("Failed to save seat sections. Please try again.");
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // Helper to get showtime start time for display
  const getShowtimeDisplay = (showtimeId: string) => {
    const showtime = showtimes.find((st) => st.id === showtimeId);
    if (!showtime) return "Unknown showtime";

    const startTime = new Date(showtime.startTime);
    return `${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  // Helper to get price tier name for display
  const getPriceTierDisplay = (priceTierId: string) => {
    const priceTier = availablePriceTiers.find((pt) => pt.id === priceTierId);
    if (!priceTier) return "Unknown price tier";

    const categoryType = priceTier.category?.type || "Standard";
    return `${categoryType} - ${priceTier.price} ${priceTier.currency}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Seating Sections</h2>
        <p className="text-muted-foreground">
          Create seat sections for each showtime
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 flex flex-col gap-2">
          <p>{error}</p>
          <div className="flex gap-2 mt-1">
            {availablePriceTiers.length === 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep("pricing")}
                className="text-sm py-1 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Go to Pricing Step
              </button>
            )}
            {showtimes.length === 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep("showtimes")}
                className="text-sm py-1 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Go to Showtimes Step
              </button>
            )}
            {events.length === 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep("events")}
                className="text-sm py-1 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Go to Events Step
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seat Section Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Seat Section</h3>

            {!showId ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-md">
                Please complete the previous steps first.
              </div>
            ) : isLoading ? (
              <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">
                  Loading showtimes and price tiers...
                </p>
              </div>
            ) : events.length === 0 ||
              showtimes.length === 0 ||
              availablePriceTiers.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-md">
                <h4 className="font-medium">Missing Required Data</h4>
                <ul className="mt-2 space-y-1 list-disc pl-5 text-sm">
                  {events.length === 0 && (
                    <li>
                      No events found. Please{" "}
                      <button
                        type="button"
                        onClick={() => setCurrentStep("events")}
                        className="underline text-blue-600 hover:text-blue-800"
                      >
                        create events
                      </button>{" "}
                      first.
                    </li>
                  )}
                  {showtimes.length === 0 && (
                    <li>
                      No showtimes found. Please{" "}
                      <button
                        type="button"
                        onClick={() => setCurrentStep("showtimes")}
                        className="underline text-blue-600 hover:text-blue-800"
                      >
                        create showtimes
                      </button>{" "}
                      first.
                    </li>
                  )}
                  {availablePriceTiers.length === 0 && (
                    <li>
                      No price tiers found. Please{" "}
                      <button
                        type="button"
                        onClick={() => setCurrentStep("pricing")}
                        className="underline text-blue-600 hover:text-blue-800"
                      >
                        create price tiers
                      </button>{" "}
                      first.
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Showtime Selection */}
                <div className="space-y-2">
                  <label htmlFor="showtimeId" className="text-sm font-medium">
                    Showtime <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="showtimeId"
                    name="showtimeId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={form.showtimeId}
                    onChange={handleInputChange}
                    disabled={showtimes.length === 0}
                  >
                    <option value="">Select a showtime</option>
                    {showtimes.map((showtime) => (
                      <option key={showtime.id} value={showtime.id}>
                        {new Date(showtime.startTime).toLocaleDateString()} at{" "}
                        {new Date(showtime.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </option>
                    ))}
                  </select>
                  {showtimes.length === 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-red-500">
                        No showtimes available. Please create showtimes first.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCurrentStep("showtimes")}
                        className="mt-1 text-xs py-1 px-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-fit"
                      >
                        Go to Showtimes Step
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Tier Selection */}
                <div className="space-y-2">
                  <label htmlFor="priceTierId" className="text-sm font-medium">
                    Price Tier <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="priceTierId"
                    name="priceTierId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={form.priceTierId}
                    onChange={handleInputChange}
                    disabled={availablePriceTiers.length === 0}
                  >
                    <option value="">Select a price tier</option>
                    {availablePriceTiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.category?.type || "Standard"} - {tier.price}{" "}
                        {tier.currency}
                      </option>
                    ))}
                  </select>
                  {availablePriceTiers.length === 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-red-500">
                        No price tiers available. Please create price tiers
                        first.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCurrentStep("pricing")}
                        className="mt-1 text-xs py-1 px-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 w-fit"
                      >
                        Go to Pricing Step
                      </button>
                    </div>
                  )}
                </div>

                {/* Section Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Section Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="E.g., Front Section, Back Section, etc."
                    disabled={
                      showtimes.length === 0 || availablePriceTiers.length === 0
                    }
                  />
                </div>

                {/* Total Seats */}
                <div className="space-y-2">
                  <label htmlFor="totalSeats" className="text-sm font-medium">
                    Total Seats <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="totalSeats"
                    name="totalSeats"
                    type="number"
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={form.totalSeats}
                    onChange={handleInputChange}
                    disabled={
                      showtimes.length === 0 || availablePriceTiers.length === 0
                    }
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={handleAddSeatSection}
                    className="px-4 py-2 bg-primary text-black rounded-md hover:bg-primary/80"
                    disabled={
                      !form.showtimeId ||
                      !form.priceTierId ||
                      showtimes.length === 0 ||
                      availablePriceTiers.length === 0
                    }
                  >
                    Add Seat Section
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-muted/30 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>
                  Create seat sections for each showtime using your price tiers
                </li>
                <li>
                  Each seat section defines the actual seating area for a
                  specific showtime
                </li>
                <li>The total seats represents the capacity of the section</li>
                <li>You need at least one seat section to proceed</li>
              </ul>
            </div>
          </div>

          {/* Added Seat Sections List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Added Seat Sections</h3>

            {seatSections.length === 0 ? (
              <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">
                  No seat sections added yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add seat sections using the form on the left
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {seatSections.map((section) => (
                  <div
                    key={section.id}
                    className="flex justify-between items-center p-3 rounded-md border bg-card"
                  >
                    <div>
                      <p className="font-medium">
                        {section.name}
                        {section.id && section.id.startsWith("temp-") && (
                          <span className="ml-2 text-xs text-amber-500">
                            (Not saved)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getShowtimeDisplay(section.showtimeId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getPriceTierDisplay(section.priceTierId)} -{" "}
                        {section.totalSeats} seats
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        section.id && handleRemoveSeatSection(section.id)
                      }
                      className="p-1 text-muted-foreground hover:text-red-500"
                      title="Remove seat section"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step Navigation */}
        <StepNavigation
          onSave={handleSave}
          isLoading={isSubmitting}
          isDisabled={seatSections.length === 0 || !showId}
          showBack={true}
        />
      </form>
    </div>
  );
}

export default SeatingStep;
