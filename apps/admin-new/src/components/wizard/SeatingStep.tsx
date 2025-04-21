"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { StepNavigation } from "./WizardLayout";
import { apiClient } from "@repo/api-client";
import { Showtime, PriceTier } from "@repo/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Label } from "@repo/ui/components/ui/label";
import {
  AlertCircle,
  Sofa,
  PlusCircle,
  InfoIcon,
  Clock,
  Trash2,
  Loader2,
  Calendar,
  CircleDollarSign,
  Users,
  Tag,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { cn } from "@repo/ui/utils";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { format } from "date-fns";

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
    addShowtime,
    markStepCompleted: markStepComplete,
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
  const [isLoading, setIsLoading] = useState(true);
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

        // Get price tiers from the wizard store
        const storePriceTiers = Array.isArray(priceTiers) ? priceTiers : [];
        console.log(
          `Found ${storePriceTiers.length} price tiers in store:`,
          storePriceTiers
        );

        // Create a properly formatted array for price tiers
        let formattedPriceTiers: PriceTier[] = [];

        // If we have price tiers in the store, use them
        if (storePriceTiers.length > 0) {
          // Convert store tier data to fully typed PriceTier objects
          formattedPriceTiers = storePriceTiers.map((tier) => {
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
            } as PriceTier;
          });

          console.log(
            `Using ${formattedPriceTiers.length} price tiers from store`
          );
          setAvailablePriceTiers(formattedPriceTiers);
        } else {
          // Fallback to API only if store is empty
          try {
            const priceTiersData =
              await apiClient.getPriceTiersByShowId(showId);
            formattedPriceTiers = priceTiersData || [];
            setAvailablePriceTiers(formattedPriceTiers);
          } catch (priceTierError) {
            console.error(
              "Error fetching price tiers from API:",
              priceTierError
            );
            setAvailablePriceTiers([]);
          }
        }

        // ==================== SHOWTIME HANDLING ======================
        console.log(`Starting to look for showtimes...`);

        // First check if we have showtimes in the store
        let apiShowtimes: Showtime[] = [];
        const eventsList = Array.isArray(events) ? events : [];

        // Check store data first
        const storeShowtimeArray = Array.isArray(storeShowtimes)
          ? storeShowtimes
          : [];
        console.log(
          `Found ${storeShowtimeArray.length} showtimes in store:`,
          storeShowtimeArray
        );

        // If we have data in the store, try to use it
        if (storeShowtimeArray.length > 0) {
          // We need to convert them to the API format for consistency with our component
          for (const storeShowtime of storeShowtimeArray) {
            try {
              // Need to handle both string and Date formats for consistency
              const startTimeStr =
                typeof storeShowtime.startTime === "string"
                  ? storeShowtime.startTime
                  : "";

              const endTimeStr =
                typeof storeShowtime.endTime === "string"
                  ? storeShowtime.endTime
                  : "";

              // Create a correctly formatted showtime object
              const showtime: Showtime = {
                id: storeShowtime.id,
                eventId: storeShowtime.eventId,
                startTime: new Date(startTimeStr),
                endTime: new Date(endTimeStr),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              apiShowtimes.push(showtime);
            } catch (e) {
              console.error("Error parsing store showtime:", e);
            }
          }

          console.log(
            `Successfully converted ${apiShowtimes.length} store showtimes to API format`
          );
        }
        // If nothing in store or we couldn't parse them, try the API
        else if (eventsList.length > 0) {
          console.log(`No valid showtimes found in store. Trying API...`);

          let foundAnyShowtimes = false;

          // For each event, try to get showtimes
          for (const event of eventsList) {
            if (!event.id || event.id.startsWith("temp-")) continue;

            try {
              console.log(`Fetching showtimes for event ID ${event.id}...`);
              const eventShowtimes = await apiClient.getShowtimesByEventId(
                event.id
              );

              if (eventShowtimes && eventShowtimes.length > 0) {
                foundAnyShowtimes = true;
                console.log(
                  `Found ${eventShowtimes.length} showtimes for event ${event.id}`
                );

                // Add to our API showtimes collection
                apiShowtimes = [...apiShowtimes, ...eventShowtimes];

                // Also add to the store for next time
                for (const showtime of eventShowtimes) {
                  const storeShowtime = {
                    id: showtime.id,
                    eventId: showtime.eventId,
                    startTime:
                      showtime.startTime instanceof Date
                        ? showtime.startTime.toISOString()
                        : typeof showtime.startTime === "string"
                          ? showtime.startTime
                          : new Date(showtime.startTime).toISOString(),
                    endTime:
                      showtime.endTime instanceof Date
                        ? showtime.endTime.toISOString()
                        : typeof showtime.endTime === "string"
                          ? showtime.endTime
                          : new Date(showtime.endTime).toISOString(),
                    isPublic: true,
                  };

                  // Add to store
                  addShowtime(storeShowtime);
                }
              }
            } catch (eventError) {
              console.error(
                `Error fetching showtimes for event ${event.id}:`,
                eventError
              );
            }
          }

          if (foundAnyShowtimes) {
            console.log(`Found showtimes via API. Marking step as completed.`);
            markStepComplete("showtimes");
          }
        }

        console.log(`Total showtimes found: ${apiShowtimes.length}`);
        setShowtimes(apiShowtimes);

        // ==================== END SHOWTIME HANDLING ===================

        // Set initial form values if we have showtimes and price tiers
        if (apiShowtimes.length > 0 && formattedPriceTiers.length > 0) {
          // Pre-fill the form with the first showtime and price tier
          setForm((prevForm) => ({
            ...prevForm,
            showtimeId: apiShowtimes[0].id,
            priceTierId: formattedPriceTiers[0].id,
            name: `${formattedPriceTiers[0].category?.type || "Standard"} Section`,
          }));
        }

        // Check for seat sections in the store
        const storeSeatSectionsList = Array.isArray(storeSeatSections)
          ? storeSeatSections
          : [];
        console.log(
          `Found ${storeSeatSectionsList.length} seat sections in store:`,
          storeSeatSectionsList
        );

        if (storeSeatSectionsList.length > 0) {
          // Convert store seat sections to our local format
          const convertedSections = storeSeatSectionsList
            .filter((section) => section && section.id)
            .map((section) => {
              // Find a showtime to associate with this section if not already specified
              const showtime = apiShowtimes.length > 0 ? apiShowtimes[0] : null;

              return {
                id: section.id,
                showtimeId: showtime?.id || "",
                priceTierId: section.priceTierId || "",
                name: section.name,
                totalSeats: section.capacity || 100,
                availableSeats: section.capacity || 100,
                isNew: false,
              };
            });

          setSeatSections(convertedSections);
        } else {
          // No seat sections in store, start with empty array
          setSeatSections([]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load necessary data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    showId,
    priceTiers,
    storeShowtimes,
    storeSeatSections,
    events,
    addShowtime,
    markStepComplete,
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;

    // Clear any error message when form changes
    setError(null);

    // Parse numeric values
    if (name === "totalSeats" || name === "availableSeats") {
      parsedValue = parseInt(value) || 0;

      // Ensure available seats doesn't exceed total seats
      if (
        name === "totalSeats" &&
        parsedValue < form.availableSeats &&
        parsedValue > 0
      ) {
        setForm({
          ...form,
          [name]: parsedValue,
          availableSeats: parsedValue,
        });
        return;
      }
    }

    setForm({
      ...form,
      [name]: parsedValue,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    // Clear any error message when form changes
    setError(null);

    // Update form with the selected value
    setForm({
      ...form,
      [name]: value,
    });

    // If changing showtime, suggest a section name based on price tier
    if (name === "showtimeId" && form.priceTierId) {
      const priceTier = availablePriceTiers.find(
        (pt) => pt.id === form.priceTierId
      );
      if (priceTier) {
        setForm((prev) => ({
          ...prev,
          [name]: value,
          name: `${priceTier.category?.type || "Standard"} Section`,
        }));
      }
    }

    // If changing price tier, suggest a section name based on it
    if (name === "priceTierId") {
      const priceTier = availablePriceTiers.find((pt) => pt.id === value);
      if (priceTier) {
        setForm((prev) => ({
          ...prev,
          [name]: value,
          name: `${priceTier.category?.type || "Standard"} Section`,
        }));
      }
    }
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

    if (form.availableSeats < 0 || form.availableSeats > form.totalSeats) {
      setError("Available seats must be between 0 and total seats");
      return false;
    }

    // Check if a section with the same name already exists for this showtime
    const duplicateSection = seatSections.find(
      (section) =>
        section.showtimeId === form.showtimeId &&
        section.name.toLowerCase() === form.name.toLowerCase()
    );

    if (duplicateSection) {
      setError(
        `A section named "${form.name}" already exists for this showtime`
      );
      return false;
    }

    return true;
  };

  const handleAddSeatSection = () => {
    if (!validateForm()) return;

    // Create a new seat section with a temporary ID
    const newSeatSection: SeatSectionWithId = {
      ...form,
      id: `temp-${new Date().getTime()}`,
      isNew: true,
    };

    // Add to local state
    setSeatSections([...seatSections, newSeatSection]);

    // Reset the form but keep showtime and price tier selections
    setForm({
      ...form,
      name: "", // Clear only the name
      totalSeats: 100,
      availableSeats: 100,
    });

    // Suggest a new name based on price tier
    const priceTier = availablePriceTiers.find(
      (pt) => pt.id === form.priceTierId
    );
    if (priceTier) {
      setForm((prev) => ({
        ...prev,
        name: `${priceTier.category?.type || "Standard"} Section ${seatSections.length + 1}`,
      }));
    }
  };

  const handleRemoveSeatSection = (sectionId: string) => {
    setSeatSections(seatSections.filter((section) => section.id !== sectionId));
  };

  const handleSave = async () => {
    if (seatSections.length === 0) {
      setError("Please add at least one seating section");
      return;
    }

    if (!showId) {
      setError("Show ID is required. Please complete the previous steps.");
      return;
    }

    try {
      setIsSubmitting(true);
      setGlobalLoading(true);

      // Save each seat section that is marked as new
      const savedSections = [];

      for (const section of seatSections) {
        if (section.isNew && section.id?.startsWith("temp-")) {
          // Create the seat section via API
          try {
            console.log(`Creating seat section: ${section.name}`);
            const createData = {
              name: section.name,
              showtimeId: section.showtimeId,
              priceTierId: section.priceTierId,
              totalSeats: section.totalSeats,
              availableSeats: section.totalSeats,
            };

            const createdSection =
              await apiClient.createSeatSectionViaShow(createData);

            console.log("Successfully created seat section:", createdSection);

            // Add the created section to our saved list
            savedSections.push({
              id: createdSection.id,
              ...section,
              isNew: false,
            });

            // Add to the wizard store with the format it expects
            addSeatingSection({
              id: createdSection.id,
              showId: showId,
              name: createdSection.name,
              capacity: createdSection.availableSeats,
              priceTierId: createdSection.priceTierId,
            });
          } catch (error) {
            console.error(
              `Error creating seat section ${section.name}:`,
              error
            );
            setError(`Failed to create section: ${section.name}`);
          }
        } else {
          // This section already exists, just add it to our list
          savedSections.push(section);
        }
      }

      // Mark step as completed and proceed only if we have successfully saved sections
      if (savedSections.length > 0) {
        markStepCompleted("seating");
        setCurrentStep("review");
      } else {
        setError("Failed to save any sections. Please try again.");
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

  const getShowtimeDisplay = (showtimeId: string) => {
    const showtime = showtimes.find((st) => st.id === showtimeId);
    if (!showtime) return "Unknown Showtime";

    try {
      // Find the event for this showtime
      const eventsList = Array.isArray(events) ? events : [];
      const event = eventsList.find((e) => e.id === showtime.eventId);

      // Format the date and time
      let formattedDate = "Unknown Date";
      let formattedTime = "Unknown Time";

      try {
        const startTime = new Date(showtime.startTime);
        if (!isNaN(startTime.getTime())) {
          // Try to get date from event first
          const eventDate =
            event && event.date ? new Date(event.date) : startTime;

          if (!isNaN(eventDate.getTime())) {
            formattedDate = format(eventDate, "MMM d, yyyy");
          }

          formattedTime = format(startTime, "h:mm a");
        }
      } catch (formatError) {
        console.error("Error formatting date/time:", formatError);
        // Use raw values as fallback
        formattedDate = event?.date?.toString() || "Unknown Date";
        formattedTime = showtime.startTime?.toString() || "Unknown Time";
      }

      return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
      console.error("Error in getShowtimeDisplay:", error);
      return `Showtime ID: ${showtimeId}`;
    }
  };

  const getPriceTierDisplay = (priceTierId: string) => {
    const priceTier = availablePriceTiers.find((pt) => pt.id === priceTierId);
    if (!priceTier) return "Unknown Price Tier";

    const categoryName =
      priceTier.category?.name || priceTier.description || "Standard";
    return `${categoryName} - ${priceTier.price} ${priceTier.currency}`;
  };

  const getPriceTierColor = (priceTierId: string) => {
    const priceTier = availablePriceTiers.find((pt) => pt.id === priceTierId);
    if (!priceTier) return "bg-gray-100 text-gray-800";

    // Return color based on tier type/description
    const type =
      priceTier.category?.type?.toUpperCase() ||
      priceTier.description?.toUpperCase() ||
      "";

    if (type.includes("VIP")) return "bg-primary/10 text-primary";
    if (type.includes("PREMIUM")) return "bg-secondary/20 text-secondary";
    if (type.includes("REGULAR")) return "bg-muted text-muted-foreground";

    return "bg-muted text-muted-foreground";
  };

  // Check if we have actual data to show
  const hasShowtimes = showtimes && showtimes.length > 0;
  const hasPriceTiers = availablePriceTiers && availablePriceTiers.length > 0;
  const hasEvents = Array.isArray(events) && events.length > 0;

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold">Seating Sections</CardTitle>
        <CardDescription>
          Create seating sections for each showtime and price tier
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {!showId ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete the previous steps first.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
            <p className="text-muted-foreground">Loading section data...</p>
          </div>
        ) : !hasShowtimes ? (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {hasEvents
                  ? "No showtimes available. Please go back and add showtimes first."
                  : "No events or showtimes found. You need to create events and showtimes before adding seating sections."}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8 space-y-4">
              <Clock className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Missing Showtimes</h3>
              <p className="text-center text-muted-foreground">
                {hasEvents
                  ? "Your show has events, but no showtimes have been created yet. Showtimes are specific times when the show will be performed on each event date."
                  : "Both events and showtimes are required to create seating sections. Please complete those steps first."}
              </p>
              <Button
                onClick={() =>
                  hasEvents
                    ? setCurrentStep("showtimes")
                    : setCurrentStep("events")
                }
                className="mt-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to {hasEvents ? "Showtimes" : "Events"} Step
              </Button>
            </div>
          </div>
        ) : !hasPriceTiers ? (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No price tiers found. You need to create price tiers before
                adding seating sections.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8 space-y-4">
              <CircleDollarSign className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Missing Price Tiers</h3>
              <p className="text-center text-muted-foreground">
                Price tiers are required to create seating sections. Please go
                back to the Pricing step to add at least one price tier.
              </p>
              <Button
                onClick={() => setCurrentStep("pricing")}
                className="mt-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Pricing Step
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Seat Section Form */}
              <div className="space-y-5">
                <div className="flex items-center">
                  <Sofa className="mr-2 h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Add Seating Section</h3>
                </div>

                <div className="space-y-4 p-4 rounded-md border border-muted bg-muted/10">
                  {/* Showtime Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="showtimeId" className="font-medium">
                      Showtime <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.showtimeId}
                      onValueChange={(value) =>
                        handleSelectChange("showtimeId", value)
                      }
                    >
                      <SelectTrigger id="showtimeId">
                        <SelectValue placeholder="Select a showtime" />
                      </SelectTrigger>
                      <SelectContent>
                        {showtimes.map((showtime) => (
                          <SelectItem key={showtime.id} value={showtime.id}>
                            {getShowtimeDisplay(showtime.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Tier Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="priceTierId" className="font-medium">
                      Price Tier <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.priceTierId}
                      onValueChange={(value) =>
                        handleSelectChange("priceTierId", value)
                      }
                    >
                      <SelectTrigger id="priceTierId">
                        <SelectValue placeholder="Select a price tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePriceTiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            <div className="flex items-center">
                              <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                              {tier.category?.type ||
                                tier.description ||
                                "Standard"}{" "}
                              - {tier.price} {tier.currency}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Section Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">
                      Section Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Front Row, Orchestra, Balcony"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Total Seats */}
                    <div className="space-y-2">
                      <Label htmlFor="totalSeats" className="font-medium">
                        Total Seats <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="totalSeats"
                          name="totalSeats"
                          type="number"
                          min="1"
                          value={form.totalSeats}
                          onChange={handleInputChange}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    {/* Available Seats */}
                    <div className="space-y-2">
                      <Label htmlFor="availableSeats" className="font-medium">
                        Available Seats{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="availableSeats"
                          name="availableSeats"
                          type="number"
                          min="0"
                          max={form.totalSeats}
                          value={form.availableSeats}
                          onChange={handleInputChange}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="button"
                    onClick={handleAddSeatSection}
                    className="w-full"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
                </div>

                {/* Instructions */}
                <div className="bg-muted/40 rounded-md p-4 flex items-start">
                  <InfoIcon className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Tips:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Create multiple seating sections for each showtime
                      </li>
                      <li>Each section should be assigned a price tier</li>
                      <li>Specify the total number of seats in each section</li>
                      <li>
                        Set the initially available seats (usually the same as
                        total seats)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Added Seat Sections */}
              <div>
                <div className="flex items-center mb-4">
                  <Sofa className="mr-2 h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    Added Seating Sections
                  </h3>
                </div>

                {seatSections.length === 0 ? (
                  <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center h-[250px]">
                    <Sofa className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No seating sections added yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add sections using the form on the left
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[380px] pr-4">
                    <div className="space-y-3">
                      {seatSections.map((section) => (
                        <Card
                          key={section.id}
                          className={cn(
                            "border overflow-hidden transition-all hover:shadow-md",
                            section.isNew
                              ? "border-primary/30 bg-primary/5"
                              : ""
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-base">
                                    {section.name}
                                  </h4>
                                  {section.isNew && (
                                    <Badge
                                      variant="outline"
                                      className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
                                    >
                                      Not saved
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-2 mt-2 text-sm">
                                  <div className="flex items-center text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5 mr-2" />
                                    <span>
                                      {getShowtimeDisplay(section.showtimeId)}
                                    </span>
                                  </div>

                                  <div className="flex items-center text-muted-foreground">
                                    <CircleDollarSign className="h-3.5 w-3.5 mr-2" />
                                    <Badge
                                      variant="outline"
                                      className={getPriceTierColor(
                                        section.priceTierId
                                      )}
                                    >
                                      {getPriceTierDisplay(section.priceTierId)}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center text-muted-foreground">
                                    <Users className="h-3.5 w-3.5 mr-2" />
                                    <span>
                                      {section.availableSeats} available /{" "}
                                      {section.totalSeats} total seats
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                        section.id &&
                                        handleRemoveSeatSection(section.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove section</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            {/* Step Navigation */}
            <StepNavigation
              onSave={handleSave}
              isLoading={isSubmitting}
              isDisabled={seatSections.length === 0}
              showBack={true}
            />
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default SeatingStep;
