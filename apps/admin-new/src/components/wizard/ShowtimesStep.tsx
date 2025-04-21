"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { format } from "date-fns";
import { StepNavigation } from "./WizardLayout";
import { apiClient } from "@repo/api-client";
import { Showtime } from "@repo/api-client";

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
              const startTime = new Date(showtime.startTime);
              const endTime = new Date(showtime.endTime);

              localShowtimes.push({
                id: showtime.id,
                eventId: showtime.eventId,
                startTime: `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`,
                endTime: `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`,
                isNew: false,
              });
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
      } catch (error) {
        console.error("Error loading showtimes:", error);
        setError("Failed to load existing showtimes");
      } finally {
        setIsLoading(false);
      }
    };

    loadShowtimes();
  }, [events, showId]);

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
    if (validateForm()) {
      const newShowtime: ShowtimeWithId = {
        ...form,
        isNew: true,
      };

      setShowtimes([...showtimes, newShowtime]);

      // Reset the form to default values but keep the same event
      setForm({
        ...form,
        startTime: "19:00",
        endTime: "21:00",
      });
    }
  };

  const handleRemoveShowtime = (index: number) => {
    const newShowtimes = [...showtimes];
    newShowtimes.splice(index, 1);
    setShowtimes(newShowtimes);
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    setCurrentEventId(eventId);
    setForm({
      ...form,
      eventId,
    });
  };

  const handleSave = async () => {
    if (showtimes.length === 0) {
      setError("You need to add at least one showtime");
      return;
    }

    try {
      setIsSubmitting(true);
      setGlobalLoading(true);

      // Array to track created showtimes
      const createdShowtimeIds: string[] = [];

      // Save all new showtimes to the API
      for (const showtime of showtimes) {
        // Only create new showtimes that don't have an ID yet
        if (showtime.isNew) {
          const eventId = showtime.eventId;
          const event = eventsList.find((e) => e.id === eventId);

          if (!event) {
            console.error("Event not found for showtime:", showtime);
            continue;
          }

          // Create a date object from the event date and showtime
          const eventDate = new Date(event.date);
          const startTimeParts = showtime.startTime.split(":");
          const endTimeParts = showtime.endTime.split(":");

          const startTime = new Date(eventDate);
          startTime.setHours(
            parseInt(startTimeParts[0]),
            parseInt(startTimeParts[1])
          );

          const endTime = new Date(eventDate);
          endTime.setHours(
            parseInt(endTimeParts[0]),
            parseInt(endTimeParts[1])
          );

          // Convert to ISO string for API
          const showtimeData = {
            eventId: eventId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          };

          console.log("Creating showtime:", showtimeData);
          const createdShowtime = await apiClient.createShowtime(showtimeData);
          console.log("Successfully created showtime:", createdShowtime);

          // Add the newly created showtime to the wizard store
          if (createdShowtime && createdShowtime.id) {
            console.log(
              `Adding showtime ID ${createdShowtime.id} to the wizard store`
            );

            // Add to wizard store
            addShowtime({
              id: createdShowtime.id,
              eventId: createdShowtime.eventId,
              startTime:
                typeof createdShowtime.startTime === "string"
                  ? createdShowtime.startTime
                  : createdShowtime.startTime.toISOString(),
              endTime:
                typeof createdShowtime.endTime === "string"
                  ? createdShowtime.endTime
                  : createdShowtime.endTime.toISOString(),
              isPublic: true,
            });

            // Track created IDs
            createdShowtimeIds.push(createdShowtime.id);
          }
        } else if (showtime.id) {
          // This is an existing showtime, just track its ID
          createdShowtimeIds.push(showtime.id);
        }
      }

      console.log("All showtimes saved/tracked:", createdShowtimeIds);

      // Mark step as completed
      markStepCompleted("showtimes");

      // Move to the next step
      setCurrentStep("seating");
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

  // Get showtimes for the current event
  const filteredShowtimes = currentEventId
    ? showtimes.filter((showtime) => showtime.eventId === currentEventId)
    : [];

  // Get the event date for display
  const currentEvent = eventsList.find((event) => event.id === currentEventId);

  const eventDate = currentEvent
    ? format(new Date(currentEvent.date), "EEEE, MMMM d, yyyy")
    : "";

  const hasEvents = eventsList.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Showtimes</h2>
        <p className="text-muted-foreground">
          Set specific times for each event date
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Showtime Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Showtime</h3>

            {!hasEvents ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-md">
                No events have been added yet. Please go back to the Events step
                and add at least one event date.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Event Selection */}
                <div className="space-y-2">
                  <label htmlFor="eventId" className="text-sm font-medium">
                    Event Date
                  </label>
                  <select
                    id="eventId"
                    name="eventId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={form.eventId}
                    onChange={handleEventChange}
                  >
                    {eventsList.map((event) => (
                      <option key={event.id} value={event.id}>
                        {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div className="space-y-2">
                    <label htmlFor="startTime" className="text-sm font-medium">
                      Start Time
                    </label>
                    <input
                      id="startTime"
                      name="startTime"
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={form.startTime}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* End Time */}
                  <div className="space-y-2">
                    <label htmlFor="endTime" className="text-sm font-medium">
                      End Time
                    </label>
                    <input
                      id="endTime"
                      name="endTime"
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={form.endTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div>
                  <button
                    type="button"
                    onClick={handleAddShowtime}
                    className="px-4 py-2 bg-primary text-black rounded-md hover:bg-primary/80"
                  >
                    Add Showtime
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-muted/30 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>Add all showtimes for each event date</li>
                <li>
                  Start and end times should include the full duration of the
                  show
                </li>
                <li>Make sure showtimes don't overlap</li>
                <li>
                  You can add multiple showtimes per day (matinee, evening,
                  etc.)
                </li>
              </ul>
            </div>
          </div>

          {/* Added Showtimes List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {eventDate ? `Showtimes for ${eventDate}` : "Showtimes"}
            </h3>

            {isLoading ? (
              <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">Loading showtimes...</p>
              </div>
            ) : filteredShowtimes.length === 0 ? (
              <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">
                  No showtimes added yet for this event
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add showtimes using the form on the left
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {filteredShowtimes
                  .sort((a, b) => {
                    const aTime = a.startTime.split(":");
                    const bTime = b.startTime.split(":");
                    return (
                      parseInt(aTime[0]) * 60 +
                      parseInt(aTime[1]) -
                      (parseInt(bTime[0]) * 60 + parseInt(bTime[1]))
                    );
                  })
                  .map((showtime, index) => {
                    const startParts = showtime.startTime.split(":");
                    const endParts = showtime.endTime.split(":");

                    const startHour = parseInt(startParts[0]);
                    const startMinute = startParts[1];
                    const startAmPm = startHour >= 12 ? "PM" : "AM";
                    const displayStartHour =
                      startHour > 12
                        ? startHour - 12
                        : startHour === 0
                          ? 12
                          : startHour;

                    const endHour = parseInt(endParts[0]);
                    const endMinute = endParts[1];
                    const endAmPm = endHour >= 12 ? "PM" : "AM";
                    const displayEndHour =
                      endHour > 12
                        ? endHour - 12
                        : endHour === 0
                          ? 12
                          : endHour;

                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 rounded-md border bg-card"
                      >
                        <div>
                          <p className="font-medium">
                            {`${displayStartHour}:${startMinute} ${startAmPm} - ${displayEndHour}:${endMinute} ${endAmPm}`}
                            {showtime.isNew && (
                              <span className="ml-2 text-xs text-amber-500">
                                (Not saved)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {parseInt(endParts[0]) * 60 +
                              parseInt(endParts[1]) -
                              (parseInt(startParts[0]) * 60 +
                                parseInt(startParts[1]))}{" "}
                            minutes
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveShowtime(index)}
                          className="p-1 text-muted-foreground hover:text-red-500"
                          title="Remove showtime"
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
                    );
                  })}
              </div>
            )}

            {/* Event Tabs */}
            {hasEvents && eventsList.length > 1 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">All Event Dates:</h4>
                <div className="flex flex-wrap gap-2">
                  {eventsList.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setCurrentEventId(event.id)}
                      className={`px-3 py-1 text-sm rounded-full ${
                        currentEventId === event.id
                          ? "bg-primary text-black"
                          : "bg-muted hover:bg-muted-foreground/20"
                      }`}
                    >
                      {format(new Date(event.date), "MMM d")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step Navigation */}
        <StepNavigation
          onSave={handleSave}
          isLoading={isSubmitting}
          isDisabled={showtimes.length === 0}
          showBack={true}
        />
      </form>
    </div>
  );
}

export default ShowtimesStep;
