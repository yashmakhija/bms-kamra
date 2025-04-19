import { useEffect } from "react";
import ShowWizard from "../components/shows/ShowWizard";
import { useShowWizardStore } from "../store/show-wizard";

export function ShowWizardPage() {
  const { resetWizard } = useShowWizardStore();

  // Reset wizard state when component mounts
  useEffect(() => {
    resetWizard();
  }, [resetWizard]);

  return (
    <div className="container mx-auto py-8 mt-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Show</h1>
      <ShowWizard />
    </div>
  );
}
