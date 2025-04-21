"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { WizardStepId } from "./types";

interface WizardStep {
  id: WizardStepId;
  label: string;
  description: string;
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
    <div className="flex justify-between pt-6 mt-8 border-t">
      {/* Back button - only show if showBack is true and we're not on the first step */}
      {showBack && previousStepId ? (
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 text-muted-foreground hover:text-foreground border border-muted hover:border-border rounded-md"
        >
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
            className="px-4 py-2 text-muted-foreground hover:text-foreground border border-muted hover:border-border rounded-md"
          >
            {skipLabel}
          </button>
        )}

        {/* Save/Next button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading || isDisabled}
          className="px-6 py-2 bg-primary text-black rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : nextLabel}
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
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Show</h1>
        <p className="text-muted-foreground">
          Complete all steps to create and publish your show
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Steps navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav aria-label="Progress" className="sticky top-4">
            <ol role="list" className="space-y-4">
              {WIZARD_STEPS.map((step) => {
                const isActive = step.id === currentStepId;
                const isCompleted = completedSteps.includes(step.id);
                const isClickable = isCompleted || isActive;

                return (
                  <li key={step.id}>
                    <button
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isClickable}
                      className={`group w-full flex items-start gap-3 p-3 rounded-md ${
                        isActive
                          ? "bg-primary/10 border border-primary"
                          : isCompleted
                            ? "bg-primary-foreground/10 border border-primary/30 hover:border-primary/70"
                            : "bg-muted/30 border border-muted cursor-not-allowed opacity-70"
                      }`}
                    >
                      <div
                        className={`rounded-full flex items-center justify-center w-8 h-8 flex-shrink-0 ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : isActive
                              ? "border-2 border-primary text-primary"
                              : "border-2 border-muted-foreground text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span>{WIZARD_STEPS.indexOf(step) + 1}</span>
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span
                          className={`text-sm font-medium ${
                            isActive || isCompleted
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
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

        {/* Main content */}
        <div className="flex-1 border rounded-lg p-6">{children}</div>
      </div>
    </div>
  );
}

export default WizardLayout;
