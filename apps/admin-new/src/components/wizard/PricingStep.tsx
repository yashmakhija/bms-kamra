"use client";

import React, { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { StepNavigation } from "./WizardLayout";
import { apiClient, PriceTierCreateWithTypeInput } from "@repo/api-client";
import { PriceTier as ApiPriceTier, Category } from "@repo/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Label } from "@repo/ui/components/ui/label";
import {
  AlertCircle,
  CircleDollarSign,
  Loader2,
  Plus,
  Trash,
  Tag,
  InfoIcon,
  BadgeCheck,
} from "lucide-react";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { Badge } from "@repo/ui/components/ui/badge";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { cn } from "@repo/ui/utils";

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

  const handleSelectChange = (name: string, value: string) => {
    setForm({
      ...form,
      [name]: value,
    });
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

  // Function to render the category badge with appropriate color
  const getCategoryBadgeVariant = (type: string) => {
    switch (type.toUpperCase()) {
      case "VIP":
        return "default";
      case "PREMIUM":
        return "secondary";
      case "REGULAR":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold">Pricing Tiers</CardTitle>
        <CardDescription>Set up pricing tiers for your show</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Price Tier Form */}
            <div className="space-y-5">
              <div className="flex items-center">
                <CircleDollarSign className="mr-2 h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Add Price Tier</h3>
              </div>

              {!showId ? (
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete the previous steps first.
                  </AlertDescription>
                </Alert>
              ) : isLoading ? (
                <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Loading price tiers...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Category Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="categoryType" className="font-medium">
                      Category Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.categoryType}
                      onValueChange={(value) =>
                        handleSelectChange("categoryType", value)
                      }
                    >
                      <SelectTrigger id="categoryType">
                        <SelectValue placeholder="Select a category type" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center">
                              <Badge
                                variant={getCategoryBadgeVariant(type)}
                                className="mr-2"
                              >
                                {type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Price */}
                    <div className="space-y-2">
                      <Label htmlFor="price" className="font-medium">
                        Price <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        {form.currency === "USD" ? (
                          <CircleDollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        ) : form.currency === "EUR" ? (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex items-center justify-center">€</span>
                        ) : form.currency === "GBP" ? (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex items-center justify-center">£</span>
                        ) : (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex items-center justify-center">₹</span>
                        )}
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          min="1"
                          step="1"
                          value={form.price}
                          onChange={handleInputChange}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                      <Label htmlFor="currency" className="font-medium">
                        Currency <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={form.currency}
                        onValueChange={(value) =>
                          handleSelectChange("currency", value)
                        }
                      >
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-medium">
                      Description
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      placeholder="E.g., Premium seats, VIP section, etc."
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="button"
                    onClick={handleAddPriceTier}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Price Tier
                  </Button>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 bg-muted/40 rounded-md p-4 flex items-start">
                <InfoIcon className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Create price tiers for each category type (VIP, PREMIUM,
                      REGULAR)
                    </li>
                    <li>
                      Each price tier defines pricing for a specific category
                      type
                    </li>
                    <li>
                      Price tiers will be used to create seating sections in the
                      next step
                    </li>
                    <li>You need at least one price tier to proceed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Added Price Tiers List */}
            <div>
              <div className="flex items-center mb-4">
                <Tag className="mr-2 h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Added Price Tiers</h3>
              </div>

              {priceTiers.length === 0 ? (
                <div className="bg-muted/30 p-6 rounded-md flex flex-col items-center justify-center text-center h-[250px]">
                  <CircleDollarSign className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No price tiers added yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add price tiers using the form on the left
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-3">
                    {priceTiers.map((tier) => (
                      <Card
                        key={
                          tier.id || `tier-${tier.categoryType}-${tier.price}`
                        }
                        className={cn(
                          "border overflow-hidden transition-all hover:shadow-md",
                          tier.id && tier.id.startsWith("temp-")
                            ? "border-primary/30 bg-primary/5"
                            : ""
                        )}
                      >
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={getCategoryBadgeVariant(
                                  tier.categoryType
                                )}
                              >
                                {tier.categoryType}
                              </Badge>
                              {tier.id && tier.id.startsWith("temp-") ? (
                                <Badge
                                  variant="outline"
                                  className="bg-primary/10 text-primary"
                                >
                                  Not saved
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                >
                                  <BadgeCheck className="h-3 w-3 mr-1" />
                                  Saved
                                </Badge>
                              )}
                            </div>
                            <p className="text-lg font-bold mt-1">
                              {tier.price} {tier.currency}
                            </p>
                            {tier.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {tier.description}
                              </p>
                            )}
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    tier.id && handleRemovePriceTier(tier.id)
                                  }
                                  disabled={!tier.id}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove price tier</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
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
      </CardContent>
    </Card>
  );
}

export default PricingStep;
