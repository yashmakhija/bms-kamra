"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { Event } from "../wizard/types";
import { format, isValid, parse, isBefore, addDays } from "date-fns";
import { StepNavigation } from "./WizardLayout";
import { apiClient } from "@repo/api-client";

export function EventsStep() {
  const {
    setEvents,
    events = [],
    addEvent,
    removeEvent,
    markStepCompleted,
    setCurrentStep,
    showDetails,
    setError: setGlobalError,
    setLoading: setGlobalLoading,
    showId,
  } = useWizardStore();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateString, setDateString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!showId) {
      setError("Please complete the details step first to create a show");
    }
  }, [showId]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateString(e.target.value);

    // Parse the date
    const parsedDate = parse(e.target.value, "yyyy-MM-dd", new Date());

    if (isValid(parsedDate)) {
      setSelectedDate(parsedDate);
      setError(null);
    } else {
      setSelectedDate(null);
      setError("Please enter a valid date");
    }
  };

  const handleAddEvent = () => {
    if (!selectedDate) {
      setError("Please select a valid date");
      return;
    }

    // Check if date is in the past
    if (isBefore(selectedDate, addDays(new Date(), -1))) {
      setError("Cannot add events in the past");
      return;
    }

    // Create a safe events list
    const eventList = Array.isArray(events) ? events : [];

    // Check if date already exists
    const dateExists = eventList.some(
      (event) =>
        format(new Date(event.date), "yyyy-MM-dd") ===
        format(selectedDate, "yyyy-MM-dd")
    );

    if (dateExists) {
      setError("This date already has an event");
      return;
    }

    // Add the event (locally first)
    const newEvent: Event = {
      id: `temp-${new Date().getTime()}`, // Temporary ID until API creates one
      date: format(selectedDate, "yyyy-MM-dd"),
      showId: showId || "", // Use empty string as fallback to ensure type compatibility
    };

    addEvent(newEvent);
    setDateString("");
    setSelectedDate(null);
    setError(null);
  };

  const handleRemoveEvent = (eventId: string) => {
    removeEvent(eventId);
  };

  const handleSave = async () => {
    console.log("Starting handleSave in EventsStep");
    console.log("Current showId:", showId);
    console.log("Events to save:", events);

    const eventList = Array.isArray(events) ? events : [];
    if (eventList.length === 0) {
      setError("You need to add at least one event date");
      return;
    }

    if (!showId) {
      setError("Please complete the details step first to create a show");
      return;
    }

    console.log("Validation passed, proceeding to save events");

    try {
      setIsSubmitting(true);
      setGlobalLoading(true);

      // Create a new array to store updated events with real IDs
      const savedEvents = [];

      // Process existing and new events
      for (const event of eventList) {
        if (event.id && event.id.startsWith("temp-")) {
          // Create new event
          const apiEvent = await apiClient.createEvent({
            showId: showId,
            date: event.date,
          });

          // Convert API event to wizard event format
          const newEvent = {
            id: apiEvent.id,
            date:
              typeof apiEvent.date === "object"
                ? apiEvent.date.toISOString()
                : apiEvent.date,
            showId: apiEvent.showId,
          };

          // Add the new event with real ID to our savedEvents array
          savedEvents.push(newEvent);
          console.log(
            `Created event with ID ${newEvent.id} for date ${event.date}`
          );
        } else if (!event.id) {
          // Create new event without temp id
          const apiEvent = await apiClient.createEvent({
            showId: showId,
            date: event.date,
          });

          // Convert API event to wizard event format
          const newEvent = {
            id: apiEvent.id,
            date:
              typeof apiEvent.date === "object"
                ? apiEvent.date.toISOString()
                : apiEvent.date,
            showId: apiEvent.showId,
          };

          // Add the new event with real ID to our savedEvents array
          savedEvents.push(newEvent);
          console.log(
            `Created event with ID ${newEvent.id} for date ${event.date}`
          );
        } else {
          // This is an existing event with a real ID, keep it
          savedEvents.push(event);
        }
      }

      // Update the events in the store with the saved events (with real IDs)
      console.log("Updating events in store with real IDs:", savedEvents);
      setEvents(savedEvents);

      // All events saved successfully
      console.log("All events saved successfully:", savedEvents);

      // Mark step as completed
      markStepCompleted("events");
      console.log("Marked events step as completed");

      // Move to the next step
      console.log("Transitioning to showtimes step");
      setCurrentStep("showtimes");
    } catch (error) {
      console.error("Error saving events:", error);
      setError("Failed to save events. Please try again.");
      setGlobalError("Failed to save events. Please try again.");
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const eventList = Array.isArray(events) ? events : [];
  const hasEvents = eventList.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Event Dates</h2>
        <p className="text-muted-foreground">
          Add dates when this show will be performed
        </p>
      </div>

      {!showId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-md mb-4">
          Please complete the show details step first before adding events.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Date Input Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Event Date</h3>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateString}
                onChange={handleDateChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                min={format(new Date(), "yyyy-MM-dd")}
                disabled={!showId}
              />
              <button
                type="button"
                onClick={handleAddEvent}
                className="px-4 py-2 bg-primary text-black rounded-md hover:bg-primary/80"
                disabled={!selectedDate || !showId}
              >
                Add
              </button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Instructions */}
            <div className="mt-6 bg-muted/30 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>Add each date your show will be performed</li>
                <li>
                  You'll be able to add specific showtimes for each date later
                </li>
                <li>You can add multiple dates for recurring shows</li>
                <li>Dates must be in the future</li>
              </ul>
            </div>
          </div>

          {/* Added Events List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Added Event Dates</h3>
            {!hasEvents ? (
              <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">
                  No event dates added yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add dates using the form on the left
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {eventList
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex justify-between items-center p-3 rounded-md border bg-card"
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(event.date), "EEEE")}
                          {event.id.startsWith("temp-") && (
                            <span className="ml-2 text-xs text-amber-500">
                              (Not saved)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.date), "MMMM d, yyyy")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveEvent(event.id)}
                        className="p-1 text-muted-foreground hover:text-red-500"
                        title="Remove event"
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
          isDisabled={!hasEvents || !showId}
          showBack={true}
        />
      </form>
    </div>
  );
}

export default EventsStep;
