"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { apiClient } from "@repo/api-client";
import { Venue } from "@repo/api-client";
import { StepNavigation } from "./WizardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Label } from "@repo/ui/components/ui/label";
import { Switch } from "@repo/ui/components/ui/switch";
import {
  AlertCircle,
  Building2,
  Clock,
  InfoIcon,
  Loader2,
  Image,
} from "lucide-react";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { cn } from "@repo/ui/utils";

interface FormErrors {
  name?: string;
  description?: string;
  venue?: string;
  duration?: string;
  image?: string;
  ageLimit?: string;
  language?: string;
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
        console.log("Venues data:", venuesData);

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

    if (!showDetails.image) {
      newErrors.image = "Image is required";
    }

    if (!showDetails.ageLimit) {
      newErrors.ageLimit = "Age limit is required";
    }

    if (!showDetails.language) {
      newErrors.language = "Language is required";
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

  const handleSelectChange = (name: string, value: string) => {
    updateShowDetails({ [name]: value });

    // Mark field as touched
    setTouched({ ...touched, [name]: true });

    // Clear error
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    updateShowDetails({ isPublic: checked });
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
      imageUrl: showDetails.image,
      ageLimit: showDetails.ageLimit,
      language: showDetails.language,
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
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold">Show Details</CardTitle>
        <CardDescription>
          Provide basic information about your show
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Show Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium">
              Show Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={showDetails.name || ""}
              onChange={handleInputChange}
              placeholder="Enter show name"
              className={cn(
                touched.name && errors.name && "border-destructive"
              )}
            />
            {touched.name && errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              value={showDetails.description || ""}
              onChange={handleInputChange}
              placeholder="Write a short description of the show"
              className={cn(
                touched.description &&
                  errors.description &&
                  "border-destructive"
              )}
            />
            {touched.description && errors.description && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Venue */}
            <div className="space-y-2">
              <Label htmlFor="venue" className="font-medium">
                Venue <span className="text-destructive">*</span>
              </Label>
              <Select
                value={showDetails.venue || ""}
                onValueChange={(value) => handleSelectChange("venue", value)}
                disabled={isPageLoading || venuesList.length === 0}
              >
                <SelectTrigger
                  id="venue"
                  className={cn(
                    touched.venue && errors.venue && "border-destructive",
                    isPageLoading && "opacity-70"
                  )}
                >
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  {venuesList.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name} {venue.city ? `(${venue.city})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.venue && errors.venue && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {errors.venue}
                </p>
              )}
              {venuesError && (
                <div className="mt-2 space-y-2">
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      {venuesError}
                    </AlertDescription>
                  </Alert>
                  <Button
                    type="button"
                    onClick={createDummyVenue}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isPageLoading}
                  >
                    {isPageLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Building2 className="mr-2 h-4 w-4" />
                        Create a sample venue
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="font-medium">
                Duration (min) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  value={showDetails.duration || ""}
                  onChange={handleInputChange}
                  placeholder="Enter duration in minutes"
                  className={cn(
                    "pl-8",
                    touched.duration && errors.duration && "border-destructive"
                  )}
                />
              </div>
              {touched.duration && errors.duration && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {errors.duration}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="ageLimit" className="font-medium">
                Age Limit <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ageLimit"
                value={showDetails.ageLimit || ""}
                name="ageLimit"
                onChange={handleInputChange}
                placeholder="Enter age limit"
                className={cn(
                  "pl-8",
                  touched.ageLimit && errors.ageLimit && "border-destructive"
                )}
              />
              {touched.ageLimit && errors.ageLimit && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {errors.ageLimit}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="language" className="font-medium">
                Language <span className="text-destructive">*</span>
              </Label>
              <Input
                id="language"
                value={showDetails.language || ""}
                name="language"
                onChange={handleInputChange}
                placeholder="Enter language"
              />
              {touched.language && errors.language && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {errors.language}
                </p>
              )}
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label htmlFor="image" className="font-medium">
                Image URL <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Image className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="image"
                  name="image"
                  type="text"
                  value={showDetails.image || ""}
                  onChange={handleInputChange}
                  placeholder="Enter image URL"
                  className={cn(
                    "pl-8",
                    touched.image && errors.image && "border-destructive"
                  )}
                />
              </div>
              {touched.image && errors.image && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  {errors.image}
                </p>
              )}
              {showDetails.image && (
                <div className="mt-2 right-8">
                  <p className="text-sm text-muted-foreground mb-1 font-bold">
                    Preview:
                  </p>
                  <img
                    src={showDetails.image}
                    alt="Show preview"
                    className="w-full h-auto object-cover rounded-md border"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/400x200?text=Invalid+Image+URL";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/40 rounded-md p-4 flex items-start">
            <InfoIcon className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">
                Tips for creating a great show:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Use a clear, descriptive name that captures your show's
                  essence
                </li>
                <li>
                  Provide a detailed description to help attendees understand
                  what to expect
                </li>
                <li>Set an accurate duration to help with scheduling</li>
              </ul>
            </div>
          </div>

          {/* Step Navigation */}
          <StepNavigation
            onSave={handleSave}
            isLoading={isSubmitting}
            isDisabled={venuesList.length === 0}
            nextLabel="Save & Continue"
            showBack={false}
          />
        </form>
      </CardContent>
    </Card>
  );
}

export default DetailsStep;
