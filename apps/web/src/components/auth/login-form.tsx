import { useState } from "react";
import { useAuthStore } from "../../store/auth";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { AlertCircle, Mail, Lock } from "lucide-react";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ email, password });
      onSuccess();
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert
          variant="destructive"
          className="text-sm py-2 border border-red-200 bg-red-50"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            Password
          </Label>
          <a
            href="#"
            className="text-sm text-[#e31001] hover:text-red-700 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Handle forgot password
            }}
          >
            Forgot password?
          </a>
        </div>
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

      <Button
        type="submit"
        className="w-full h-11 bg-[#e31001] hover:bg-red-700 text-white rounded-lg font-medium mt-3 transition-colors shadow-sm"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
