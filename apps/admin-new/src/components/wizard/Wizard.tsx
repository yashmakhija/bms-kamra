"use client";

import React, { useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import WizardLayout from "./WizardLayout";
import DetailsStep from "./DetailsStep";
import PricingStep from "./PricingStep";
import EventsStep from "./EventsStep";
import ShowtimesStep from "./ShowtimesStep";
import SeatingStep from "./SeatingStep";
import ReviewStep from "./ReviewStep";
import { WizardStepId } from "./types";

// Define the correct step order
const STEP_ORDER: WizardStepId[] = [
  "details",
  "pricing",
  "events",
  "showtimes",
  "seating",
  "review",
];

export function Wizard() {
  const { currentStepId, resetWizard, setCurrentStep } = useWizardStore();

  // Reset the wizard state when the component is unmounted
  useEffect(() => {
    return () => {
      resetWizard();
    };
  }, [resetWizard]);

  // Render the appropriate step component based on currentStepId
  const renderStep = () => {
    switch (currentStepId) {
      case "details":
        return <DetailsStep />;
      case "pricing":
        return <PricingStep />;
      case "events":
        return <EventsStep />;
      case "showtimes":
        return <ShowtimesStep />;
      case "seating":
        return <SeatingStep />;
      case "review":
        return <ReviewStep />;
      default:
        // If we get an invalid step ID, reset to the first step
        setCurrentStep(STEP_ORDER[0]);
        return <DetailsStep />;
    }
  };

  return <WizardLayout>{renderStep()}</WizardLayout>;
}

export default Wizard;
