"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { Event } from "../wizard/types";
import { format, isValid, parse, isBefore, addDays } from "date-fns";
import { StepNavigation } from "./WizardLayout";
import { apiClient } from "@repo/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Calendar } from "@repo/ui/components/ui/calendar";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  PlusCircle,
  InfoIcon,
  CalendarDaysIcon,
  Trash2,
  Loader2,
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
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold">Event Dates</CardTitle>
        <CardDescription>
          Add dates when this show will be performed
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {!showId && (
          <Alert variant="default" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete the show details step first before adding events.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date Input Section */}
            <div className="space-y-5">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Add Event Date</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="border rounded-md p-3 bg-card">
                  <Calendar
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={(day) => setSelectedDate(day || null)}
                    disabled={(date) => isBefore(date, new Date())}
                    className="mx-auto"
                    initialFocus
                  />
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {selectedDate ? (
                        <span className="font-medium text-foreground">
                          {format(selectedDate, "PPP")}
                        </span>
                      ) : (
                        "Select a date"
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddEvent}
                      disabled={!selectedDate || !showId}
                      className="ml-auto"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <div className="mt-6 bg-muted/40 rounded-md p-4 flex items-start">
                <InfoIcon className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Add each date your show will be performed</li>
                    <li>
                      You'll be able to add specific showtimes for each date
                      later
                    </li>
                    <li>You can add multiple dates for recurring shows</li>
                    <li>Dates must be in the future</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Added Events List */}
            <div>
              <div className="flex items-center mb-4">
                <CalendarDaysIcon className="mr-2 h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Added Event Dates</h3>
              </div>

              {!hasEvents ? (
                <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center h-[250px]">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No event dates added yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add dates using the form on the left
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {eventList
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                      )
                      .map((event) => (
                        <Card
                          key={event.id}
                          className={cn(
                            "border overflow-hidden transition-all hover:shadow-md",
                            event.id.startsWith("temp-")
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
                                  {format(new Date(event.date), "EEEE")}
                                </Badge>
                                {event.id.startsWith("temp-") && (
                                  <Badge
                                    variant="outline"
                                    className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
                                  >
                                    Not saved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm mt-1 font-medium">
                                {format(new Date(event.date), "MMMM d, yyyy")}
                              </p>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemoveEvent(event.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Remove event</p>
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

          {/* Step Navigation */}
          <StepNavigation
            onSave={handleSave}
            isLoading={isSubmitting}
            isDisabled={!hasEvents || !showId}
            showBack={true}
          />
        </form>
      </CardContent>
    </Card>
  );
}

export default EventsStep;
