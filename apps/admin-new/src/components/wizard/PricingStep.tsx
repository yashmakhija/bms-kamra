"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { StepNavigation } from "./WizardLayout";
import { apiClient, PriceTierCreateWithTypeInput } from "@repo/api-client";
import { PriceTier as ApiPriceTier, Category } from "@repo/api-client";
import { PriceTier } from "./types"; // Import the PriceTier interface from wizard types

// Updated interface to match the new API approach
interface PriceTierForm {
  categoryType: string; // Using categoryType instead of categoryId
  price: number;
  currency: string;
  description: string;
}

// Updated interface for our local state - includes categoryType which our API uses
interface WizardPriceTier {
  id?: string;
  name: string;
  price: number;
  categoryType: string;
  currency: string;
  description?: string;
}

export function PricingStep() {
  const {
    showId,
    priceTiers: storePriceTiers,
    addPricingTier,
    removePricingTier,
    updatePricingTier,
    markStepCompleted,
    setCurrentStep,
    setLoading: setGlobalLoading,
    setError: setGlobalError,
  } = useWizardStore();

  const [form, setForm] = useState<PriceTierForm>({
    categoryType: "VIP", // Default to VIP
    price: 100,
    currency: "INR",
    description: "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPriceTiers, setSavedPriceTiers] = useState<ApiPriceTier[]>([]);
  const [priceTiers, setPriceTiers] = useState<WizardPriceTier[]>([]);

  // Load existing price tiers
  useEffect(() => {
    if (!showId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch existing price tiers for this show
        const priceTiersData = await apiClient.getPriceTiersByShowId(showId);
        if (priceTiersData && Array.isArray(priceTiersData)) {
          setSavedPriceTiers(priceTiersData);

          // Update the local state with existing price tiers
          const wizardPriceTiers = priceTiersData.map((tier) => ({
            id: tier.id,
            name:
              tier.description ||
              `${tier.category?.type || "Standard"} - ${tier.price} ${tier.currency}`,
            price: tier.price,
            categoryType: tier.category?.type || "VIP",
            currency: tier.currency,
            description: tier.description,
          }));

          setPriceTiers(wizardPriceTiers);
        }
      } catch (error) {
        console.error("Error loading price tiers:", error);
        setError("Failed to load price tiers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "price") {
      // Parse numeric values with a minimum value of 1
      const numValue = parseInt(value) || 0;
      setForm({
        ...form,
        [name]: numValue <= 0 ? 1 : numValue,
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.categoryType) {
      setError("Please select a category type");
      return false;
    }

    if (form.price <= 0) {
      setError("Price must be greater than 0");
      return false;
    }

    if (!form.currency) {
      setError("Please select a currency");
      return false;
    }

    return true;
  };

  const handleAddPriceTier = () => {
    if (!validateForm()) return;

    if (!showId) {
      setError("Show ID is required. Please complete the previous steps.");
      return;
    }

    // Create a price tier object for our local state
    const newPriceTier: WizardPriceTier = {
      id: `temp-${new Date().getTime()}`,
      name: `${form.categoryType} - ${form.price} ${form.currency}`,
      price: form.price > 0 ? form.price : 100, // Ensure price is positive
      categoryType: form.categoryType,
      currency: form.currency,
      description: form.description,
    };

    // Add to our local state
    setPriceTiers([...priceTiers, newPriceTier]);

    // Add to the wizard store - convert to the store's expected format
    // The store's PriceTier type doesn't have categoryType, but has showId
    addPricingTier({
      id: newPriceTier.id || "",
      name: newPriceTier.name,
      price: newPriceTier.price,
      currency: newPriceTier.currency,
      description: newPriceTier.description,
      showId: showId,
    });

    // Reset the form but keep the category type
    setForm({
      ...form,
      price: 100,
      description: "",
    });
  };

  const handleRemovePriceTier = (tierId: string) => {
    // Update local state
    setPriceTiers(priceTiers.filter((tier) => tier.id !== tierId));

    // Update wizard store
    removePricingTier(tierId);
  };

  const handleSave = async () => {
    if (priceTiers.length === 0) {
      setError("Please add at least one price tier");
      return;
    }

    if (!showId) {
      setError("Show ID is required. Please complete the previous steps.");
      return;
    }

    try {
      setIsSubmitting(true);
      setGlobalLoading(true);

      // Create a new array to store saved price tiers
      const savedPriceTiers: WizardPriceTier[] = [];

      // Process each price tier
      for (const tier of priceTiers) {
        if (tier.id && tier.id.startsWith("temp-")) {
          // Use the new API method with categoryType
          const priceTierData: PriceTierCreateWithTypeInput = {
            showId: showId,
            categoryType: tier.categoryType,
            price: tier.price,
            currency: tier.currency,
            description: tier.description || tier.name,
            capacity: 100, // Add default capacity
          };

          try {
            // Use the createPriceTierWithType method that accepts categoryType
            const apiPriceTier =
              await apiClient.createPriceTierWithType(priceTierData);

            // Convert API price tier to wizard format
            const newPriceTier: WizardPriceTier = {
              id: apiPriceTier.id,
              name:
                apiPriceTier.description ||
                `${apiPriceTier.category?.type || "Standard"} - ${apiPriceTier.price} ${apiPriceTier.currency}`,
              price: apiPriceTier.price,
              categoryType: apiPriceTier.category?.type || tier.categoryType,
              currency: apiPriceTier.currency,
              description: apiPriceTier.description,
            };

            savedPriceTiers.push(newPriceTier);
          } catch (priceTierError) {
            console.error("Failed to create price tier:", priceTierError);
            setError(`Failed to create price tier: ${tier.name}`);
          }
        } else {
          // This is an existing price tier, keep it
          savedPriceTiers.push(tier);
        }
      }

      // Update price tiers in the wizard store
      // Convert our WizardPriceTier objects to the format expected by the store
      const storePriceTiers = savedPriceTiers.map((tier) => ({
        id: tier.id || "",
        name: tier.name,
        price: tier.price,
        currency: tier.currency,
        description: tier.description,
        showId: showId,
      }));

      // Update our local state
      setPriceTiers(savedPriceTiers);

      // Replace all price tiers in the wizard store
      // First remove all existing ones
      priceTiers.forEach((tier) => {
        if (tier.id) removePricingTier(tier.id);
      });

      // Then add all the saved ones
      storePriceTiers.forEach((tier) => {
        addPricingTier(tier);
      });

      // Mark step as completed only if we have at least one saved price tier
      if (savedPriceTiers.length > 0) {
        markStepCompleted("pricing");

        // Move to the next step
        setCurrentStep("events");
      } else {
        setError("Failed to save any price tiers. Please try again.");
      }
    } catch (error) {
      console.error("Error saving price tiers:", error);
      setError("Failed to save price tiers. Please try again.");
      setGlobalError("Failed to save price tiers. Please try again.");
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // Standard category types as per documentation
  const categoryTypes = ["VIP", "PREMIUM", "REGULAR"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pricing Tiers</h2>
        <p className="text-muted-foreground">
          Set up pricing tiers for your show
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Price Tier Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Price Tier</h3>

            {!showId ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-md">
                Please complete the previous steps first.
              </div>
            ) : isLoading ? (
              <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">Loading price tiers...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Category Type Selection */}
                <div className="space-y-2">
                  <label htmlFor="categoryType" className="text-sm font-medium">
                    Category Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoryType"
                    name="categoryType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={form.categoryType}
                    onChange={handleInputChange}
                  >
                    {categoryTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={form.price}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={form.currency}
                      onChange={handleInputChange}
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <input
                    id="description"
                    name="description"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="E.g., Premium seats, VIP section, etc."
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div>
                  <button
                    type="button"
                    onClick={handleAddPriceTier}
                    className="px-4 py-2 bg-primary text-black rounded-md hover:bg-primary/80"
                  >
                    Add Price Tier
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-muted/30 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>
                  Create price tiers for each category type (VIP, PREMIUM,
                  REGULAR)
                </li>
                <li>
                  Each price tier defines pricing for a specific category type
                </li>
                <li>
                  Price tiers will be used to create seating sections in the
                  next step
                </li>
                <li>You need at least one price tier to proceed</li>
              </ul>
            </div>
          </div>

          {/* Added Price Tiers List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Added Price Tiers</h3>

            {priceTiers.length === 0 ? (
              <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">
                  No price tiers added yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add price tiers using the form on the left
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {priceTiers.map((tier) => (
                  <div
                    key={tier.id || `tier-${tier.categoryType}-${tier.price}`}
                    className="flex justify-between items-center p-3 rounded-md border bg-card"
                  >
                    <div>
                      <p className="font-medium">
                        {tier.name}
                        {tier.id && tier.id.startsWith("temp-") && (
                          <span className="ml-2 text-xs text-amber-500">
                            (Not saved)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tier.price} {tier.currency}
                        {tier.description ? ` - ${tier.description}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => tier.id && handleRemovePriceTier(tier.id)}
                      className="p-1 text-muted-foreground hover:text-red-500"
                      title="Remove price tier"
                      disabled={!tier.id}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step Navigation */}
        <StepNavigation
          onSave={handleSave}
          isLoading={isSubmitting}
          isDisabled={priceTiers.length === 0 || !showId}
          showBack={true}
        />
      </form>
    </div>
  );
}

export default PricingStep;
