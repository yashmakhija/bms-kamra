"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { format } from "date-fns";
import { apiClient } from "@repo/api-client";
import { StepNavigation } from "./WizardLayout";
import { Venue } from "@repo/api-client";

export function ReviewStep() {
  const {
    showId,
    showDetails,
    events = [],
    priceTiers = [],
    seatSections = [],
    showtimes = [],
    setLoading: setGlobalLoading,
    setError: setGlobalError,
    markStepCompleted,
  } = useWizardStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      if (!showDetails.venue) return;

      setIsLoading(true);
      try {
        const venueData = await apiClient.getVenueById(showDetails.venue);
        setVenue(venueData);
      } catch (error) {
        console.error("Error fetching venue details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenueDetails();
  }, [showDetails.venue]);

  const handlePublish = async () => {
    if (!showId) {
      setGlobalError("No show ID found. Please complete all previous steps.");
      return;
    }

    try {
      setIsSubmitting(true);
      setGlobalLoading(true);

      // Call the API to publish the show
      const publishedShow = await apiClient.publishShow(showId);
      console.log("Successfully published show:", publishedShow);

      setSuccess(true);
      markStepCompleted("review");
    } catch (error) {
      console.error("Error publishing show:", error);
      setGlobalError(
        error instanceof Error
          ? `Failed to publish show: ${error.message}`
          : "Failed to publish show"
      );
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  };

  // Format and group data for display
  const groupedShowtimes = showtimes.reduce(
    (acc, showtime) => {
      const event = events.find((e) => e.id === showtime.eventId);
      if (!event) return acc;

      if (!acc[event.id]) {
        acc[event.id] = {
          event,
          showtimes: [],
        };
      }

      acc[event.id].showtimes.push(showtime);
      return acc;
    },
    {} as Record<
      string,
      { event: (typeof events)[0]; showtimes: typeof showtimes }
    >
  );

  // Map price tier IDs to their display names
  const priceTierMap = priceTiers.reduce(
    (acc, tier) => {
      acc[tier.id] = tier;
      return acc;
    },
    {} as Record<string, (typeof priceTiers)[0]>
  );

  // Count sections by price tier
  const sectionsByPriceTier = seatSections.reduce(
    (acc, section) => {
      if (!section.priceTierId) return acc;

      if (!acc[section.priceTierId]) {
        acc[section.priceTierId] = [];
      }

      acc[section.priceTierId].push(section);
      return acc;
    },
    {} as Record<string, typeof seatSections>
  );

  // Function to format time from ISO string
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  };

  // Function to format date from ISO string
  const formatDate = (isoString: string) => {
    try {
      return format(new Date(isoString), "EEEE, MMMM d, yyyy");
    } catch (e) {
      return isoString;
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-md text-center">
          <h2 className="text-2xl font-bold mb-4">
            Show Published Successfully!
          </h2>
          <div className="text-lg mb-6">
            Your show has been published and is now available for booking.
          </div>
          <a
            href={`/admin/shows/${showId}`}
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            View Show Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review Show</h2>
        <p className="text-muted-foreground">
          Review all details before publishing your show
        </p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-gray-200 rounded-md"></div>
          <div className="h-20 bg-gray-200 rounded-md"></div>
          <div className="h-60 bg-gray-200 rounded-md"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Show Details Summary */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-4 border-b">
              <h3 className="text-lg font-semibold">Show Details</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Show Name</h4>
                  <p className="font-semibold text-lg">{showDetails.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Duration</h4>
                  <p>{showDetails.duration} minutes</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Venue</h4>
                  <p>
                    {venue ? (
                      <>
                        {venue.name}, {venue.city}
                        {venue.address && (
                          <span className="block text-sm text-gray-500">
                            {venue.address}
                          </span>
                        )}
                      </>
                    ) : (
                      showDetails.venue
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Visibility</h4>
                  <p>
                    {showDetails.isPublic ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Private
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-500 mb-1">Description</h4>
                <p className="whitespace-pre-line">{showDetails.description}</p>
              </div>
            </div>
          </div>

          {/* Pricing Tiers Summary */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-4 border-b">
              <h3 className="text-lg font-semibold">Pricing Tiers</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {priceTiers.length > 0 ? (
                  priceTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="border rounded-md p-4 bg-card"
                    >
                      <h4 className="font-medium">{tier.name}</h4>
                      <p className="text-xl font-bold">
                        {tier.price} {tier.currency}
                      </p>
                      {tier.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {tier.description}
                        </p>
                      )}
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">
                          {sectionsByPriceTier[tier.id]?.length || 0} sections
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 p-4 text-center text-muted-foreground">
                    No pricing tiers defined
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Events and Showtimes Summary */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-4 border-b">
              <h3 className="text-lg font-semibold">Events & Showtimes</h3>
            </div>
            <div className="p-5">
              {events.length > 0 ? (
                <div className="space-y-6">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-md p-4 bg-card"
                    >
                      <h4 className="font-medium mb-3">
                        {formatDate(event.date)}
                      </h4>
                      <div className="space-y-2">
                        {groupedShowtimes[event.id]?.showtimes.length > 0 ? (
                          groupedShowtimes[event.id].showtimes.map(
                            (showtime, idx) => (
                              <div
                                key={showtime.id || idx}
                                className="flex flex-wrap gap-2 items-center p-2 bg-muted rounded"
                              >
                                <span className="font-medium">
                                  {formatTime(showtime.startTime)}
                                  {showtime.endTime &&
                                    ` - ${formatTime(showtime.endTime)}`}
                                </span>
                                <div className="flex-grow"></div>
                                <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                                  {
                                    seatSections.filter((s) => {
                                      const showtimesToCheck =
                                        groupedShowtimes[event.id].showtimes;
                                      return showtimesToCheck.some(
                                        (st) => st.id === s?.showtimeId
                                      );
                                    }).length
                                  }{" "}
                                  seating sections
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No showtimes for this event
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No events defined
                </div>
              )}
            </div>
          </div>

          {/* Seating Sections Summary */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-4 border-b">
              <h3 className="text-lg font-semibold">Seating Sections</h3>
            </div>
            <div className="p-5">
              {seatSections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seatSections.map((section) => {
                    const priceTier = section.priceTierId
                      ? priceTierMap[section.priceTierId]
                      : null;

                    // Find showtime for this section
                    const showtime = showtimes.find(
                      (st) => st.id === section.showtimeId
                    );
                    // Find event for this showtime
                    const event = showtime
                      ? events.find((e) => e.id === showtime.eventId)
                      : null;

                    return (
                      <div
                        key={section.id}
                        className="border rounded-md p-4 bg-card"
                      >
                        <h4 className="font-medium">{section.name}</h4>
                        <div className="mt-2 space-y-1 text-sm">
                          {event && (
                            <p className="text-gray-600">
                              {formatDate(event.date)}
                            </p>
                          )}
                          {showtime && (
                            <p className="text-gray-600">
                              {formatTime(showtime.startTime)}
                              {showtime.endTime &&
                                ` - ${formatTime(showtime.endTime)}`}
                            </p>
                          )}
                          <p className="text-gray-600">
                            {section.capacity} seats
                          </p>
                          {priceTier && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {priceTier.name} - {priceTier.price}{" "}
                                {priceTier.currency}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No seating sections defined
                </div>
              )}
            </div>
          </div>

          {/* Warnings and Errors */}
          {events.length === 0 && (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-md">
              Warning: Your show has no events scheduled. You may want to add
              events before publishing.
            </div>
          )}

          {showtimes.length === 0 && (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-md">
              Warning: Your show has no showtimes defined. You may want to add
              showtimes before publishing.
            </div>
          )}

          {priceTiers.length === 0 && (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-md">
              Warning: Your show has no price tiers defined. You may want to add
              price tiers before publishing.
            </div>
          )}

          {seatSections.length === 0 && (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-md">
              Warning: Your show has no seating sections. You may want to add
              seating sections before publishing.
            </div>
          )}

          {/* Publish CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-black rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Publishing..." : "Publish Show"}
            </button>
          </div>

          {/* Step Navigation */}
          <StepNavigation
            onSave={handlePublish}
            isLoading={isSubmitting}
            isDisabled={false}
            nextLabel="Publish Show"
            showBack={true}
          />
        </div>
      )}
    </div>
  );
}

export default ReviewStep;
