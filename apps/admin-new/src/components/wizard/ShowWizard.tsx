"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  LayoutIcon,
  CheckIcon,
} from "lucide-react";
import {
  useWizardStore,
  WIZARD_STEPS,
  useCurrentStep,
  useCanProceedFromStep,
} from "./store";
import { WizardStepId } from "./types";
import { cn } from "@/lib/utils";

// Import steps
import ShowDetailsStep from "./steps/ShowDetailsStep";
import EventsStep from "./steps/EventsStep";
import ShowtimesStep from "./steps/ShowtimesStep";
import PricingStep from "./steps/PricingStep";
import SeatingStep from "./steps/SeatingStep";
import ReviewStep from "./steps/ReviewStep";

// Step icon mapping
const STEP_ICONS = {
  details: HomeIcon,
  events: CalendarIcon,
  showtimes: ClockIcon,
  pricing: TagIcon,
  seating: LayoutIcon,
  review: CheckIcon,
};

// Step title mapping
const STEP_TITLES = {
  details: "Show Details",
  events: "Events",
  showtimes: "Showtimes",
  pricing: "Price Tiers",
  seating: "Seating Layout",
  review: "Review & Publish",
};

export default function ShowWizard() {
  // Get current step and navigation functions from store
  const currentStepId = useCurrentStep();
  const {
    goToStep,
    nextStep,
    prevStep,
    isLoading,
    error,
    setError,
    completedSteps,
    showId,
    eventIds,
    showtimeIds,
    priceTierIds,
    seatSectionIds,
  } = useWizardStore();

  // Check if we can proceed from current step
  const canProceed = useCanProceedFromStep(currentStepId);

  // Clear error when step changes
  useEffect(() => {
    setError(null);
  }, [currentStepId, setError]);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStepId) {
      case "details":
        return <ShowDetailsStep />;
      case "events":
        return <EventsStep showId={showId} />;
      case "showtimes":
        return <ShowtimesStep showId={showId} eventIds={eventIds} />;
      case "pricing":
        return <PricingStep showId={showId} />;
      case "seating":
        return <SeatingStep showId={showId} />;
      case "review":
        return (
          <ReviewStep
            showId={showId}
            eventIds={eventIds}
            showtimeIds={showtimeIds}
            priceTierIds={priceTierIds}
            seatSectionIds={seatSectionIds}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  // Determine next button text
  const getNextButtonText = () => {
    if (currentStepId === "review") {
      return "Publish";
    }

    return "Next";
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Show</h1>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((stepId, index) => {
            const StepIcon = STEP_ICONS[stepId];
            const isActive = currentStepId === stepId;
            const isCompleted = completedSteps.includes(stepId);
            const isPast = WIZARD_STEPS.indexOf(currentStepId) > index;

            return (
              <div key={stepId} className="flex flex-1 items-center">
                {/* Line before first step */}
                {index === 0 && <div className="h-0.5 flex-1 bg-gray-200" />}

                {/* Step indicator */}
                <div
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2",
                    isActive
                      ? "border-primary bg-primary text-white"
                      : isCompleted || isPast
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300 bg-white"
                  )}
                  onClick={() => {
                    // Only allow navigating to completed steps or the current step
                    if (isCompleted || isPast || isActive) {
                      goToStep(stepId);
                    }
                  }}
                >
                  <StepIcon className="w-5 h-5" />

                  {/* Step number badge */}
                  <span className="absolute -top-8 text-xs font-medium">
                    {STEP_TITLES[stepId]}
                  </span>
                </div>

                {/* Line between steps */}
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    isCompleted || isPast ? "bg-primary" : "bg-gray-200"
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <Card className="w-full">
        <CardContent className="pt-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Step content */}
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStepId === WIZARD_STEPS[0] || isLoading}
              className="flex items-center"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </Button>

            <Button
              onClick={nextStep}
              disabled={!canProceed || isLoading}
              className="flex items-center"
            >
              {getNextButtonText()}
              {currentStepId !== "review" && (
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
