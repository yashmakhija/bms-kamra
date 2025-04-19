import { useState } from "react";
import { useAuthStore } from "../../store/auth";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { AlertCircle, ArrowLeft, Phone, Keyboard } from "lucide-react";

interface PhoneLoginFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function PhoneLoginForm({ onSuccess, onBack }: PhoneLoginFormProps) {
  const { requestOtp, loginWithPhone, isLoading, error, clearError } =
    useAuthStore();
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      // Phone number validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error(
          "Please enter a valid phone number (E.164 format recommended, e.g. +919876543210)"
        );
      }

      const result = await requestOtp(phone);
      setStage("otp");

      // In development, we get the OTP code in the response
      if (result.code) {
        setDevCode(result.code);
      }
    } catch (error: any) {
      // Error is handled by the store
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await loginWithPhone(phone, otpCode);
      onSuccess();
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-[#e31001] transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to login
      </button>

      {error && (
        <Alert
          variant="destructive"
          className="text-sm py-2 border border-red-200 bg-red-50"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stage === "phone" ? (
        <form onSubmit={handleRequestOtp} className="space-y-5 mt-4">
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-gray-700 font-medium">
              Phone Number
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 h-11 rounded-lg border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 transition-colors"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Enter your phone number in E.164 format (include country code)
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-[#e31001] hover:bg-red-700 text-white rounded-lg font-medium mt-3 transition-colors shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5 mt-4">
          <div className="space-y-3">
            <Label htmlFor="otp" className="text-gray-700 font-medium">
              OTP Code
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Keyboard className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="otp"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="pl-10 h-11 rounded-lg border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 transition-colors text-center letter-spacing-wide"
                required
                maxLength={6}
              />
            </div>
            {devCode && (
              <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100 mt-2">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-[#e31001]">
                    Development:
                  </span>{" "}
                  OTP code is{" "}
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">
                    {devCode}
                  </span>
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              We've sent a 6-digit code to{" "}
              <span className="font-medium">{phone}</span>
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-[#e31001] hover:bg-red-700 text-white rounded-lg font-medium mt-3 transition-colors shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>
      )}
    </div>
  );
}
