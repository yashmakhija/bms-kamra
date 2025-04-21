"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { apiClient } from "@repo/api-client";
import { Venue } from "@repo/api-client";
import { StepNavigation } from "./WizardLayout";

interface FormErrors {
  name?: string;
  description?: string;
  venue?: string;
  duration?: string;
}

export function DetailsStep() {
  const {
    showDetails,
    updateShowDetails,
    markStepCompleted,
    setCurrentStep,
    isLoading,
    setLoading,
    setError,
    setShowId,
  } = useWizardStore();
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [venuesError, setVenuesError] = useState<string | null>(null);

  // Fetch venues on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsPageLoading(true);
      setVenuesError(null);

      try {
        // Fetch venues
        const venuesData = await apiClient.getAllVenues();
        console.log("Venues data:", venuesData); // Log the data to see its structure

        // Handle different possible response structures
        if (Array.isArray(venuesData)) {
          setVenues(venuesData);
          if (venuesData.length === 0) {
            setVenuesError("No venues found in the system.");
          }
        } else if (venuesData && typeof venuesData === "object") {
          // Try to extract venue data from common response patterns
          const venuesObj = venuesData as Record<string, any>;
          const venuesArray =
            venuesObj.venues || venuesObj.data || venuesObj.items || [];
          if (Array.isArray(venuesArray)) {
            setVenues(venuesArray);
            if (venuesArray.length === 0) {
              setVenuesError("No venues found in the system.");
            }
          } else {
            setVenues([]);
            setVenuesError(
              "Invalid venue data format received from the server."
            );
          }
        } else {
          setVenues([]);
          setVenuesError("Unable to load venues. Please try again later.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setVenues([]);
        setVenuesError(
          "Error loading venues. Please check your connection and try again."
        );
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!showDetails.name) {
      newErrors.name = "Show name is required";
    }

    if (!showDetails.description) {
      newErrors.description = "Description is required";
    }

    if (!showDetails.venue) {
      newErrors.venue = "Venue is required";
    }

    if (!showDetails.duration) {
      newErrors.duration = "Duration is required";
    } else if (showDetails.duration < 1) {
      newErrors.duration = "Duration must be at least 1 minute";
    }

    setErrors(newErrors);
    // Mark all fields as touched to show all errors
    const allTouched = Object.keys(newErrors).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched({ ...touched, ...allTouched });

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    updateShowDetails({ [name]: value });

    // Mark field as touched
    setTouched({ ...touched, [name]: true });

    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    updateShowDetails({ [name]: checked });
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Map the show details to the API expected format
    const showCreateData = {
      title: showDetails.name,
      description: showDetails.description,
      venueId: showDetails.venue,
      duration: showDetails.duration || 120,
    };

    try {
      setIsSubmitting(true);
      setLoading(true);

      // Call the API to create the show
      const createdShow = await apiClient.createShow(showCreateData);
      console.log("Created show:", createdShow);

      // Store the show ID in the wizard store
      setShowId(createdShow.id);

      // Update the show details with values from the server response
      updateShowDetails({
        venue: createdShow.venueId,
        name: createdShow.title,
        description: createdShow.description,
      });

      // Mark step as completed
      markStepCompleted("details");

      // Move to the next step
      setCurrentStep("pricing");
    } catch (error) {
      console.error("Error creating show:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create show"
      );
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // Ensure venues is always an array we can safely map over
  const venuesList = Array.isArray(venues) ? venues : [];

  const createDummyVenue = async () => {
    try {
      setIsPageLoading(true);
      setVenuesError("Creating a sample venue...");

      // Create a dummy venue for testing
      const newVenue = await apiClient.createVenue({
        name: "Sample Venue",
        address: "123 Main St",
        city: "Sample City",
        country: "United States",
        capacity: 500,
      });

      // Add the new venue to the list
      setVenues([...venuesList, newVenue]);
      setVenuesError(null);
    } catch (error) {
      console.error("Error creating venue:", error);
      setVenuesError("Failed to create a sample venue. Please try again.");
    } finally {
      setIsPageLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Show Details</h2>
        <p className="text-muted-foreground">
          Provide basic information about your show
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Show Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Show Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`w-full px-3 py-2 border rounded-md ${
              touched.name && errors.name ? "border-red-500" : "border-gray-300"
            }`}
            value={showDetails.name || ""}
            onChange={handleInputChange}
            placeholder="Enter show name"
          />
          {touched.name && errors.name && (
            <p className="text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md ${
              touched.description && errors.description
                ? "border-red-500"
                : "border-gray-300"
            }`}
            value={showDetails.description || ""}
            onChange={handleInputChange}
            placeholder="Write a short description of the show"
          />
          {touched.description && errors.description && (
            <p className="text-xs text-red-500">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Venue */}
          <div className="space-y-2">
            <label htmlFor="venue" className="text-sm font-medium">
              Venue <span className="text-red-500">*</span>
            </label>
            <select
              id="venue"
              name="venue"
              className={`w-full px-3 py-2 border rounded-md ${
                touched.venue && errors.venue
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              value={showDetails.venue || ""}
              onChange={handleInputChange}
              disabled={isPageLoading || venuesList.length === 0}
            >
              <option value="">Select a venue</option>
              {venuesList.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} {venue.city ? `(${venue.city})` : ""}
                </option>
              ))}
            </select>
            {touched.venue && errors.venue && (
              <p className="text-xs text-red-500">{errors.venue}</p>
            )}
            {venuesError && (
              <div className="mt-2 flex flex-col space-y-2">
                <p className="text-xs text-amber-600">{venuesError}</p>
                <button
                  type="button"
                  onClick={createDummyVenue}
                  className="text-xs py-1 px-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 w-fit"
                  disabled={isPageLoading}
                >
                  {isPageLoading ? "Creating..." : "Create a sample venue"}
                </button>
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label htmlFor="duration" className="text-sm font-medium">
              Duration (min) <span className="text-red-500">*</span>
            </label>
            <input
              id="duration"
              name="duration"
              type="number"
              min="1"
              className={`w-full px-3 py-2 border rounded-md ${
                touched.duration && errors.duration
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              value={showDetails.duration || ""}
              onChange={handleInputChange}
              placeholder="Enter duration in minutes"
            />
            {touched.duration && errors.duration && (
              <p className="text-xs text-red-500">{errors.duration}</p>
            )}
          </div>
        </div>

        {/* Publish Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            id="isPublic"
            name="isPublic"
            type="checkbox"
            className="rounded border-gray-300"
            checked={showDetails.isPublic || false}
            onChange={handleCheckboxChange}
          />
          <label htmlFor="isPublic" className="text-sm font-medium">
            Make this show public immediately
          </label>
        </div>

        {/* Use the StepNavigation component for consistent navigation */}
        <StepNavigation
          onSave={handleSave}
          isLoading={isSubmitting}
          isDisabled={venuesList.length === 0}
          nextLabel="Save & Continue"
          showBack={false}
        />
      </form>
    </div>
  );
}

export default DetailsStep;
