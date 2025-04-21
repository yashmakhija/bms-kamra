"use client";

import { useEffect } from "react";
import { useWizardStore } from "../store/wizardStore";
// import { ShowCreationWizard } from "../components/create-show/ShowCreationWizard";
import { useEventsFormStore } from "../store/eventsForm";
import { useShowFormStore } from "../store/showForm";
import { Wizard } from "../components/wizard";

export function ShowWizardPage() {
  const { resetWizard } = useWizardStore();
  const { clearEvents } = useEventsFormStore();
  const { resetForm } = useShowFormStore();

  // Reset all wizard state when component mounts
  useEffect(() => {
    resetWizard();
    clearEvents();
    resetForm();
  }, [resetWizard, clearEvents, resetForm]);

  return <Wizard />;
}

export default ShowWizardPage;
