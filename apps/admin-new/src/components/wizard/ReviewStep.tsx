"use client";

import { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { format } from "date-fns";
import { apiClient } from "@repo/api-client";
import { StepNavigation } from "./WizardLayout";
import { Venue } from "@repo/api-client";
import {
  CheckIcon,
  ArrowRightIcon,
  TicketIcon,
  ClockIcon,
  MapPinIcon,
  EyeIcon,
  EyeOffIcon,
  DollarSignIcon,
  UsersIcon,
  DatabaseIcon,
  CalendarIcon,
  CalendarDaysIcon,
  Clock8Icon,
  CalendarXIcon,
  SofaIcon,
  TagIcon,
  AlertTriangleIcon,
  Loader2Icon,
  RocketIcon,
  ArmchairIcon,
} from "lucide-react";

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
        <div className="bg-green-50 border border-green-200 text-green-700 p-8 rounded-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">
            Show Published Successfully!
          </h2>
          <div className="text-lg mb-6 max-w-md mx-auto">
            Your show has been published and is now available for booking.
          </div>
          <a
            href={`/admin/shows/${showId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            View Show Dashboard
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
        <div className="space-y-8">
          {/* Show Details Summary */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <TicketIcon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Show Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Show Name</h4>
                  <p className="font-semibold text-lg">{showDetails.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Duration</h4>
                  <p className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    {showDetails.duration} minutes
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-500 mb-1">Venue</h4>
                  <p className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    {venue ? (
                      <>
                        {venue.name}, {venue.city}
                        {venue.address && (
                          <span className="block text-sm text-gray-500 mt-1 ml-6">
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <EyeIcon className="h-3 w-3" />
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <EyeOffIcon className="h-3 w-3" />
                        Private
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-500 mb-2">Description</h4>
                <p className="whitespace-pre-line bg-gray-50 p-3 rounded-md">
                  {showDetails.description}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Tiers Summary */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSignIcon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Pricing Tiers</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {priceTiers.length > 0 ? (
                  priceTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="border rounded-md p-4 bg-white hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-gray-800">{tier.name}</h4>
                      <p className="text-xl font-bold text-primary mt-1">
                        {tier.price} {tier.currency}
                      </p>
                      {tier.description && (
                        <p className="text-sm text-gray-500 mt-2">
                          {tier.description}
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-100 text-sm flex items-center">
                        <UsersIcon className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        <span className="text-gray-500">
                          {sectionsByPriceTier[tier.id]?.length || 0} sections
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 p-6 text-center text-gray-500 bg-gray-50 rounded-md">
                    <DatabaseIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No pricing tiers defined</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Events and Showtimes Summary */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Events & Showtimes</h3>
            </div>
            <div className="p-6">
              {events.length > 0 ? (
                <div className="space-y-6">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-md overflow-hidden bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="bg-gray-50 p-3 border-b flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <h4 className="font-medium">
                          {formatDate(event.date)}
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {groupedShowtimes[event.id]?.showtimes.length > 0 ? (
                          groupedShowtimes[event.id].showtimes.map(
                            (showtime, idx) => (
                              <div
                                key={showtime.id || idx}
                                className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 rounded"
                              >
                                <span className="font-medium flex items-center">
                                  <ClockIcon className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                  {formatTime(showtime.startTime)}
                                  {showtime.endTime &&
                                    ` - ${formatTime(showtime.endTime)}`}
                                </span>
                                <div className="flex-grow"></div>
                                <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full flex items-center gap-1">
                                  <SofaIcon className="h-3 w-3 text-gray-500" />
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
                          <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">
                            <Clock8Icon className="h-6 w-6 mx-auto mb-1.5 text-gray-400" />
                            <p className="text-sm">
                              No showtimes for this event
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-md">
                  <CalendarXIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No events defined</p>
                </div>
              )}
            </div>
          </div>

          {/* Seating Sections Summary */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <SofaIcon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Seating Sections</h3>
            </div>
            <div className="p-6">
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
                        className="border rounded-md p-4 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2">
                          <SofaIcon className="h-4 w-4 text-gray-500" />
                          <h4 className="font-medium text-gray-800">
                            {section.name}
                          </h4>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          {event && (
                            <p className="text-gray-600 flex items-center gap-2">
                              <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
                              {formatDate(event.date)}
                            </p>
                          )}
                          {showtime && (
                            <p className="text-gray-600 flex items-center gap-2">
                              <ClockIcon className="h-3.5 w-3.5 text-gray-500" />
                              {formatTime(showtime.startTime)}
                              {showtime.endTime &&
                                ` - ${formatTime(showtime.endTime)}`}
                            </p>
                          )}
                          <p className="text-gray-600 flex items-center gap-2">
                            <UsersIcon className="h-3.5 w-3.5 text-gray-500" />
                            {section.capacity} seats
                          </p>
                          {priceTier && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                <TagIcon className="h-3 w-3" />
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
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-md">
                  <SofaIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No seating sections defined</p>
                </div>
              )}
            </div>
          </div>

          {/* Warnings and Errors */}
          {(events.length === 0 ||
            showtimes.length === 0 ||
            priceTiers.length === 0 ||
            seatSections.length === 0) && (
            <div className="border border-yellow-200 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-yellow-50 p-4 border-b flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-yellow-800">
                  Important Notes
                </h3>
              </div>
              <div className="p-5 bg-yellow-50/50 space-y-3">
                {events.length === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-white border border-yellow-100 rounded-md">
                    <AlertTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-800">
                      Your show has no events scheduled. You may want to add
                      events before publishing.
                    </p>
                  </div>
                )}

                {showtimes.length === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-white border border-yellow-100 rounded-md">
                    <AlertTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-800">
                      Your show has no showtimes defined. You may want to add
                      showtimes before publishing.
                    </p>
                  </div>
                )}

                {priceTiers.length === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-white border border-yellow-100 rounded-md">
                    <AlertTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-800">
                      Your show has no price tiers defined. You may want to add
                      price tiers before publishing.
                    </p>
                  </div>
                )}

                {seatSections.length === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-white border border-yellow-100 rounded-md">
                    <AlertTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-800">
                      Your show has no seating sections. You may want to add
                      seating sections before publishing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Publish CTA */}
          <div className="mt-8 pt-6 border-t flex justify-center">
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-black rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="h-5 w-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <RocketIcon className="h-5 w-5" />
                  Publish Show
                </>
              )}
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
