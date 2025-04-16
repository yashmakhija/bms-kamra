import { useState } from "react";
import { useAuthStore } from "../../store/auth";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { AlertCircle, User, Mail, Lock } from "lucide-react";

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    try {
      await register({ name, email, password });
      onSuccess();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const displayError = formError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {displayError && (
        <Alert
          variant="destructive"
          className="text-sm py-2 border border-red-200 bg-red-50"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Label htmlFor="name" className="text-gray-700 font-medium">
          Full Name
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 h-11 rounded-lg border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 transition-colors"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="email" className="text-gray-700 font-medium">
          Email
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11 rounded-lg border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 transition-colors"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="password" className="text-gray-700 font-medium">
          Password
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 h-11 rounded-lg border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 transition-colors"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="confirm-password" className="text-gray-700 font-medium">
          Confirm Password
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 h-11 rounded-lg border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 transition-colors"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-[#e31001] hover:bg-red-700 text-white rounded-lg font-medium mt-3 transition-colors shadow-sm"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
