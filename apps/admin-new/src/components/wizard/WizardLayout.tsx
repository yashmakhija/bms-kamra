"use client";

import React from "react";
import { useWizardStore } from "../../store/wizardStore";
import { WizardStepId } from "./types";
import { CheckIcon, ChevronLeftIcon, ArrowRightIcon } from "lucide-react";

interface WizardStep {
  id: WizardStepId;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "details",
    label: "Show Details",
    description: "Basic information about the show",
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Set pricing tiers for the show",
  },
  {
    id: "events",
    label: "Events",
    description: "Add dates for the show",
  },
  {
    id: "showtimes",
    label: "Showtimes",
    description: "Set specific times for each event",
  },
  {
    id: "seating",
    label: "Seating",
    description: "Configure seating arrangements",
  },
  {
    id: "review",
    label: "Review",
    description: "Review and publish the show",
  },
];

// Helper function to conditionally join classNames
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Step navigation props
interface StepNavigationProps {
  onSave: () => Promise<void> | void;
  isLoading: boolean;
  isDisabled?: boolean;
  nextLabel?: string;
  showBack?: boolean;
  showSkip?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
}

// Reusable step navigation component
export function StepNavigation({
  onSave,
  isLoading,
  isDisabled = false,
  nextLabel = "Save & Continue",
  showBack = false,
  showSkip = false,
  skipLabel = "Skip",
  onSkip,
}: StepNavigationProps) {
  const { currentStepId, setCurrentStep, completedSteps } = useWizardStore();

  // Get the current step index
  const currentStepIndex = WIZARD_STEPS.findIndex(
    (step) => step.id === currentStepId
  );

  // Determine previous step ID
  const previousStepId =
    currentStepIndex > 0 ? WIZARD_STEPS[currentStepIndex - 1].id : null;

  // Handle back button click
  const handleBack = () => {
    if (previousStepId) {
      setCurrentStep(previousStepId);
    }
  };

  return (
    <div className="flex justify-between pt-6 mt-6 border-t border-gray-100 bg-gray-50/50 p-4 rounded-b-lg">
      {/* Back button - only show if showBack is true and we're not on the first step */}
      {showBack && previousStepId ? (
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back
        </button>
      ) : (
        <div></div> // Empty div for spacing
      )}

      <div className="flex gap-3">
        {/* Skip button - only show if showSkip is true */}
        {showSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {skipLabel}
          </button>
        )}

        {/* Save/Next button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading || isDisabled}
          className={cn(
            "flex items-center gap-2 px-6 py-2 bg-primary text-black rounded-md shadow-sm hover:bg-primary/90 transition-colors",
            (isLoading || isDisabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? "Saving..." : nextLabel}
          {!isLoading && <ArrowRightIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface WizardLayoutProps {
  children: React.ReactNode;
}

export function WizardLayout({ children }: WizardLayoutProps) {
  const { currentStepId, completedSteps, setCurrentStep } = useWizardStore();

  const handleStepClick = (step: WizardStepId) => {
    // Only allow navigation to completed steps or the current step
    if (completedSteps.includes(step) || step === currentStepId) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="w-full mt-8 max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Show</h1>
        <p className="text-muted-foreground">
          Complete all steps to create and publish your show
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Steps navigation */}
        <div className="w-full md:w-80 shrink-0">
          <div className="sticky top-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold">Progress</h3>
              <p className="text-sm text-gray-500">
                {completedSteps.length} of {WIZARD_STEPS.length} steps completed
              </p>
            </div>
            <div className="p-2">
              <nav aria-label="Progress">
                <ol role="list" className="space-y-2">
                  {WIZARD_STEPS.map((step, stepIdx) => {
                    const isActive = step.id === currentStepId;
                    const isCompleted = completedSteps.includes(step.id);
                    const isClickable = isCompleted || isActive;

                    return (
                      <li key={step.id} className="relative group">
                        {/* Tooltip for disabled steps */}
                        {!isClickable && (
                          <div className="absolute opacity-0 group-hover:opacity-100 -right-4 translate-x-full top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition-opacity z-10">
                            Complete previous steps first
                          </div>
                        )}
                        <button
                          onClick={() => handleStepClick(step.id)}
                          disabled={!isClickable}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-md transition-colors",
                            isActive
                              ? "bg-primary/10 border border-primary shadow-sm"
                              : isCompleted
                                ? "bg-green-50 border border-green-200 hover:border-green-300"
                                : "bg-gray-50 border border-transparent cursor-not-allowed opacity-70"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-full flex items-center justify-center w-8 h-8 flex-shrink-0 transition-colors",
                              isCompleted
                                ? "bg-green-500 text-white"
                                : isActive
                                  ? "border-2 border-primary text-primary bg-white"
                                  : "border-2 border-gray-300 text-gray-400 bg-white"
                            )}
                          >
                            {isCompleted ? (
                              <CheckIcon className="w-4 h-4" />
                            ) : (
                              <span>{stepIdx + 1}</span>
                            )}
                          </div>
                          <div className="flex flex-col text-left">
                            <span
                              className={cn(
                                "text-sm font-medium",
                                isActive
                                  ? "text-primary"
                                  : isCompleted
                                    ? "text-gray-900"
                                    : "text-gray-500"
                              )}
                            >
                              {step.label}
                            </span>
                            <span className="text-xs text-gray-500 line-clamp-1">
                              {step.description}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WizardLayout;
