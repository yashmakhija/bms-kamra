"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { format } from "date-fns";
import { StepNavigation } from "./WizardLayout";
import { apiClient } from "@repo/api-client";
import { Showtime } from "@repo/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";

import { Label } from "@repo/ui/components/ui/label";
import {
  AlertCircle,
  Clock,
  PlusCircle,
  InfoIcon,
  AlarmClock,
  Trash2,
  Loader2,
  Calendar,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";

interface ShowtimeForm {
  eventId: string;
  startTime: string;
  endTime: string;
}

interface ShowtimeWithId extends ShowtimeForm {
  id?: string; // For tracking existing showtimes
  isNew?: boolean; // Flag to indicate it's a newly added showtime
}

export function ShowtimesStep() {
  const {
    events = [],
    showId,
    markStepCompleted,
    setCurrentStep,
    setLoading: setGlobalLoading,
    setError: setGlobalError,
    addShowtime,
    setShowtimes: setStoreShowtimes,
  } = useWizardStore();

  // Create a safe events list
  const eventsList = Array.isArray(events) ? events : [];

  const [currentEventId, setCurrentEventId] = useState<string | null>(
    eventsList.length > 0 ? eventsList[0].id : null
  );

  const [form, setForm] = useState<ShowtimeForm>({
    eventId: eventsList.length > 0 ? eventsList[0].id : "",
    startTime: "19:00", // Default time 7:00 PM
    endTime: "21:00", // Default time 9:00 PM
  });

  const [error, setError] = useState<string | null>(null);
  const [showtimes, setShowtimes] = useState<Array<ShowtimeWithId>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedShowtimes, setSavedShowtimes] = useState<
    Record<string, Showtime[]>
  >({});

  // Update form when events change
  useEffect(() => {
    if (eventsList.length > 0 && !currentEventId) {
      setCurrentEventId(eventsList[0].id);
      setForm((form) => ({
        ...form,
        eventId: eventsList[0].id,
      }));
    }
  }, [events, currentEventId]);

  // Load existing showtimes for each event
  useEffect(() => {
    if (eventsList.length === 0 || !showId) return;

    const loadShowtimes = async () => {
      setIsLoading(true);
      try {
        const eventShowtimes: Record<string, Showtime[]> = {};
        const localShowtimes: ShowtimeWithId[] = [];
        const storeShowtimes: Showtime[] = [];

        // Fetch showtimes only for events with real IDs (not temporary IDs)
        for (const event of eventsList) {
          // Skip temporary events - they won't have showtimes on the server
          if (event.id.startsWith("temp-")) {
            console.log(`Skipping temporary event ID: ${event.id}`);
            eventShowtimes[event.id] = [];
            continue;
          }

          try {
            console.log(`Fetching showtimes for event ID: ${event.id}`);
            const response = await apiClient.getShowtimesByEventId(event.id);
            eventShowtimes[event.id] = response;

            // Convert API showtimes to local format
            response.forEach((showtime) => {
              const apiStartTime =
                typeof showtime.startTime === "string"
                  ? new Date(showtime.startTime)
                  : showtime.startTime;

              const apiEndTime =
                typeof showtime.endTime === "string"
                  ? new Date(showtime.endTime)
                  : showtime.endTime;

              localShowtimes.push({
                id: showtime.id,
                eventId: showtime.eventId,
                startTime: `${String(apiStartTime.getHours()).padStart(2, "0")}:${String(apiStartTime.getMinutes()).padStart(2, "0")}`,
                endTime: `${String(apiEndTime.getHours()).padStart(2, "0")}:${String(apiEndTime.getMinutes()).padStart(2, "0")}`,
                isNew: false,
              });

              // For the wizard store, we need a different format - with ISO strings for dates
              const wizardFormatShowtime = {
                id: showtime.id,
                eventId: showtime.eventId,
                startTime: apiStartTime.toISOString(),
                endTime: apiEndTime.toISOString(),
                isPublic: true,
              };

              storeShowtimes.push(wizardFormatShowtime as any);
            });
          } catch (error) {
            console.error(
              `Error fetching showtimes for event ${event.id}:`,
              error
            );
            eventShowtimes[event.id] = [];
          }
        }

        setSavedShowtimes(eventShowtimes);
        setShowtimes(localShowtimes);

        // Save all existing showtimes to store - ensure types match wizard store
        if (storeShowtimes.length > 0) {
          // Convert API showtimes to wizard showtimes format
          const wizardShowtimes = storeShowtimes.map((showtime) => ({
            id: showtime.id,
            eventId: showtime.eventId,
            startTime:
              showtime.startTime instanceof Date
                ? showtime.startTime.toISOString()
                : new Date(showtime.startTime).toISOString(),
            endTime:
              showtime.endTime instanceof Date
                ? showtime.endTime.toISOString()
                : new Date(showtime.endTime).toISOString(),
            isPublic: true,
          }));

          console.log(
            `Setting ${wizardShowtimes.length} showtimes in store:`,
            wizardShowtimes
          );
          setStoreShowtimes(wizardShowtimes);
          markStepCompleted("showtimes");
        }
      } catch (error) {
        console.error("Error loading showtimes:", error);
        setError("Failed to load existing showtimes");
      } finally {
        setIsLoading(false);
      }
    };

    loadShowtimes();
  }, [events, showId, setStoreShowtimes, markStepCompleted]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
    setError(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({
      ...form,
      [name]: value,
    });
    setCurrentEventId(name === "eventId" ? value : currentEventId);
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.eventId) {
      setError("Please select an event");
      return false;
    }

    if (!form.startTime) {
      setError("Please enter a start time");
      return false;
    }

    if (!form.endTime) {
      setError("Please enter an end time");
      return false;
    }

    // Check if end time is after start time
    const startTimeParts = form.startTime.split(":");
    const endTimeParts = form.endTime.split(":");

    const startHour = parseInt(startTimeParts[0], 10);
    const startMinute = parseInt(startTimeParts[1], 10);

    const endHour = parseInt(endTimeParts[0], 10);
    const endMinute = parseInt(endTimeParts[1], 10);

    if (
      endHour < startHour ||
      (endHour === startHour && endMinute <= startMinute)
    ) {
      setError("End time must be after start time");
      return false;
    }

    // Check if this showtime overlaps with an existing one for the same event
    const eventShowtimes = showtimes.filter(
      (showtime) => showtime.eventId === form.eventId
    );

    for (const showtime of eventShowtimes) {
      // Convert times to minutes for easy comparison
      const existingStart =
        parseInt(showtime.startTime.split(":")[0], 10) * 60 +
        parseInt(showtime.startTime.split(":")[1], 10);

      const existingEnd =
        parseInt(showtime.endTime.split(":")[0], 10) * 60 +
        parseInt(showtime.endTime.split(":")[1], 10);

      const newStart =
        parseInt(form.startTime.split(":")[0], 10) * 60 +
        parseInt(form.startTime.split(":")[1], 10);

      const newEnd =
        parseInt(form.endTime.split(":")[0], 10) * 60 +
        parseInt(form.endTime.split(":")[1], 10);

      // Check for overlap
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        setError(
          "This showtime overlaps with an existing showtime for this event"
        );
        return false;
      }
    }

    return true;
  };

  const handleAddShowtime = () => {
    if (!validateForm()) return;

    const newShowtime: ShowtimeWithId = {
      ...form,
      id: `temp-${new Date().getTime()}`,
      isNew: true,
    };

    setShowtimes([...showtimes, newShowtime]);

    // Reset only the times for easier adding of multiple showtimes
    setForm({
      ...form,
      startTime: "19:00",
      endTime: "21:00",
    });
  };

  const handleRemoveShowtime = (index: number) => {
    const newShowtimes = [...showtimes];
    newShowtimes.splice(index, 1);
    setShowtimes(newShowtimes);
  };

  const handleEventChange = (eventId: string) => {
    setCurrentEventId(eventId);
    setForm({
      ...form,
      eventId,
    });
  };

  const handleSave = async () => {
    if (eventsList.length === 0) {
      setError("There are no events to add showtimes to");
      return;
    }

    if (showtimes.length === 0) {
      setError("Please add at least one showtime");
      return;
    }

    if (!showId) {
      setError("Show ID is required. Please complete the previous steps.");
      return;
    }

    try {
      setIsSubmitting(true);
      setGlobalLoading(true);

      // Create a new array to store saved showtimes
      const savedShowtimesList = [];

      // Process each showtime
      for (const showtime of showtimes) {
        if (showtime.id && showtime.id.startsWith("temp-")) {
          // This is a new showtime that needs to be created via API
          const eventDate = eventsList.find(
            (event) => event.id === showtime.eventId
          )?.date;

          if (!eventDate) {
            console.error(
              `Could not find event date for event ID: ${showtime.eventId}`
            );
            continue;
          }

          // Convert the times to ISO format by combining event date + showtime
          const eventDateObj = new Date(eventDate);
          const dateString = format(eventDateObj, "yyyy-MM-dd");

          const startTimeObj = new Date(`${dateString}T${showtime.startTime}`);
          const endTimeObj = new Date(`${dateString}T${showtime.endTime}`);

          try {
            // Create the showtime via API
            const createdShowtime = await apiClient.createShowtime({
              eventId: showtime.eventId,
              startTime: startTimeObj.toISOString(),
              endTime: endTimeObj.toISOString(),
            });

            // Store the created showtime
            savedShowtimesList.push(createdShowtime);

            // Add to the wizard store for other steps to use with proper format
            const wizardShowtime = {
              id: createdShowtime.id,
              eventId: createdShowtime.eventId,
              startTime: startTimeObj.toISOString(),
              endTime: endTimeObj.toISOString(),
              isPublic: true,
            };

            console.log("Adding showtime to store:", wizardShowtime);
            addShowtime(wizardShowtime);
          } catch (error) {
            console.error("Failed to create showtime:", error);
            setError(`Failed to create showtime for ${dateString}`);
          }
        } else if (showtime.id) {
          // This showtime already exists, no need to re-create it
          savedShowtimesList.push(showtime);
        }
      }

      // Mark step as completed only if we have at least one saved showtime
      if (savedShowtimesList.length > 0) {
        markStepCompleted("showtimes");

        // Move to the next step
        setCurrentStep("seating");
      } else {
        setError("Failed to save any showtimes. Please try again.");
      }
    } catch (error) {
      console.error("Error saving showtimes:", error);
      setError("Failed to save showtimes. Please try again.");
      setGlobalError("Failed to save showtimes. Please try again.");
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // Group showtimes by event for display
  const showtimesByEvent = showtimes.reduce(
    (acc, showtime) => {
      const eventId = showtime.eventId;
      if (!acc[eventId]) {
        acc[eventId] = [];
      }
      acc[eventId].push(showtime);
      return acc;
    },
    {} as Record<string, ShowtimeWithId[]>
  );

  // Convert events to a map for easier lookup
  const eventsMap = eventsList.reduce(
    (acc, event) => {
      acc[event.id] = event;
      return acc;
    },
    {} as Record<string, (typeof eventsList)[0]>
  );

  // Get current event
  const currentEvent = currentEventId ? eventsMap[currentEventId] : null;

  // Get showtimes for current event
  const currentEventShowtimes = currentEventId
    ? showtimesByEvent[currentEventId] || []
    : [];

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold">Showtimes</CardTitle>
        <CardDescription>
          Add specific times when the show will be performed for each event date
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {eventsList.length === 0 ? (
          <Alert variant="default" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please add events before adding showtimes. Go back to the Events
              step first.
            </AlertDescription>
          </Alert>
        ) : !showId ? (
          <Alert variant="default" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete the previous steps first before adding showtimes.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs
              defaultValue={currentEventId || ""}
              value={currentEventId || ""}
              onValueChange={handleEventChange}
              className="w-full"
            >
              <div className="flex items-center mb-4">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Select Event Date</h3>
              </div>

              <TabsList className="w-full flex flex-wrap h-auto justify-start mb-6 bg-muted/50">
                {eventsList.map((event) => (
                  <TabsTrigger
                    key={event.id}
                    value={event.id}
                    className="flex-grow-0 mb-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {format(new Date(event.date), "MMM d, yyyy")}
                    {event.id.startsWith("temp-") && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-amber-500 border-amber-200"
                      >
                        New
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {eventsList.map((event) => (
                <TabsContent
                  key={event.id}
                  value={event.id}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Showtime Form */}
                    <div className="space-y-5">
                      <div className="flex items-center">
                        <AlarmClock className="mr-2 h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Add Showtime</h3>
                      </div>

                      <div className="p-4 rounded-md border border-muted bg-muted/10">
                        <div className="text-sm font-medium mb-3">
                          Event:{" "}
                          {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                        </div>

                        <input type="hidden" name="eventId" value={event.id} />

                        <div className="grid grid-cols-2 gap-4">
                          {/* Start Time */}
                          <div className="space-y-2">
                            <Label htmlFor="startTime" className="font-medium">
                              Start Time{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="startTime"
                                name="startTime"
                                type="time"
                                value={form.startTime}
                                onChange={handleInputChange}
                                className="pl-8"
                              />
                            </div>
                          </div>

                          {/* End Time */}
                          <div className="space-y-2">
                            <Label htmlFor="endTime" className="font-medium">
                              End Time{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="endTime"
                                name="endTime"
                                type="time"
                                value={form.endTime}
                                onChange={handleInputChange}
                                className="pl-8"
                              />
                            </div>
                          </div>
                        </div>

                        {error && (
                          <Alert variant="destructive" className="mt-4 py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <Button
                          type="button"
                          onClick={handleAddShowtime}
                          className="w-full mt-4"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Showtime
                        </Button>
                      </div>

                      {/* Instructions */}
                      <div className="bg-muted/40 rounded-md p-4 flex items-start">
                        <InfoIcon className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Tips:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Add multiple showtimes for each event date</li>
                            <li>Times must not overlap for the same event</li>
                            <li>End time must be after start time</li>
                            <li>You need at least one showtime to proceed</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Added Showtimes List */}
                    <div>
                      <div className="flex items-center mb-4">
                        <Clock className="mr-2 h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          Showtimes for {format(new Date(event.date), "MMM d")}
                        </h3>
                      </div>

                      {isLoading ? (
                        <div className="flex items-center justify-center h-[250px] bg-muted/30 rounded-md">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-muted-foreground">
                            Loading showtimes...
                          </span>
                        </div>
                      ) : currentEventShowtimes.length === 0 ? (
                        <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center h-[250px]">
                          <Clock className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
                          <p className="text-muted-foreground font-medium">
                            No showtimes added yet
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Add showtimes using the form on the left
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-3">
                            {currentEventShowtimes
                              .sort((a, b) => {
                                // Sort by start time
                                const aMinutes =
                                  parseInt(a.startTime.split(":")[0]) * 60 +
                                  parseInt(a.startTime.split(":")[1]);
                                const bMinutes =
                                  parseInt(b.startTime.split(":")[0]) * 60 +
                                  parseInt(b.startTime.split(":")[1]);
                                return aMinutes - bMinutes;
                              })
                              .map((showtime, index) => (
                                <Card
                                  key={showtime.id || index}
                                  className={cn(
                                    "border overflow-hidden",
                                    showtime.id &&
                                      showtime.id.startsWith("temp-")
                                      ? "border-primary/30 bg-primary/5"
                                      : ""
                                  )}
                                >
                                  <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="bg-primary/10 text-primary"
                                        >
                                          {showtime.startTime} -{" "}
                                          {showtime.endTime}
                                        </Badge>
                                        {showtime.id &&
                                          showtime.id.startsWith("temp-") && (
                                            <Badge
                                              variant="outline"
                                              className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
                                            >
                                              Not saved
                                            </Badge>
                                          )}
                                      </div>
                                      <p className="text-sm mt-1 text-muted-foreground">
                                        Duration:{" "}
                                        {(() => {
                                          const startMinutes =
                                            parseInt(
                                              showtime.startTime.split(":")[0]
                                            ) *
                                              60 +
                                            parseInt(
                                              showtime.startTime.split(":")[1]
                                            );
                                          const endMinutes =
                                            parseInt(
                                              showtime.endTime.split(":")[0]
                                            ) *
                                              60 +
                                            parseInt(
                                              showtime.endTime.split(":")[1]
                                            );
                                          const durationMinutes =
                                            endMinutes - startMinutes;
                                          const hours = Math.floor(
                                            durationMinutes / 60
                                          );
                                          const minutes = durationMinutes % 60;
                                          return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m` : ""}`;
                                        })()}
                                      </p>
                                    </div>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                                            onClick={() =>
                                              handleRemoveShowtime(
                                                showtimes.findIndex(
                                                  (s) => s.id === showtime.id
                                                )
                                              )
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Remove showtime</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Summary of all showtimes */}
            <div className="mt-6 pt-6 border-t border-muted">
              <div className="flex items-center mb-4">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">All Showtimes Summary</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(showtimesByEvent).map(
                  ([eventId, eventShowtimes]) => {
                    const event = eventsMap[eventId];
                    if (!event) return null;

                    return (
                      <Card key={eventId} className="border overflow-hidden">
                        <CardHeader className="p-3 bg-muted/20">
                          <CardTitle className="text-base">
                            {format(new Date(event.date), "EEEE, MMM d")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                          {eventShowtimes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No showtimes
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {eventShowtimes
                                .sort((a, b) => {
                                  const aTime =
                                    parseInt(a.startTime.split(":")[0]) * 60 +
                                    parseInt(a.startTime.split(":")[1]);
                                  const bTime =
                                    parseInt(b.startTime.split(":")[0]) * 60 +
                                    parseInt(b.startTime.split(":")[1]);
                                  return aTime - bTime;
                                })
                                .map((showtime, index) => (
                                  <Badge
                                    key={showtime.id || index}
                                    variant="outline"
                                    className={cn(
                                      "bg-primary/10 text-primary",
                                      showtime.id?.startsWith("temp-") &&
                                        "border-primary"
                                    )}
                                  >
                                    {showtime.startTime}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  }
                )}
              </div>
            </div>

            {/* Step Navigation */}
            <StepNavigation
              onSave={handleSave}
              isLoading={isSubmitting}
              isDisabled={showtimes.length === 0 || !showId}
              showBack={true}
            />
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default ShowtimesStep;
