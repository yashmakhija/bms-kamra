import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { PhoneLoginForm } from "./phone-login-form";
import { GoogleLoginButton } from "./google-login-button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<string>("login");

  // Log state changes for debugging
  useEffect(() => {
    console.log("AuthModal isOpen changed:", isOpen);
  }, [isOpen]);

  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      modal={true}
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange called:", open);
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Welcome to The Kunal Kamra App
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to your account or create a new one
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <LoginForm onSuccess={handleSuccess} />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <GoogleLoginButton onSuccess={handleSuccess} />
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-lg border bg-white p-2 text-sm shadow-sm hover:bg-gray-50"
                onClick={() => setActiveTab("phone")}
              >
                Login with Phone
              </button>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <RegisterForm onSuccess={handleSuccess} />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <GoogleLoginButton onSuccess={handleSuccess} />
            </div>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4">
            <PhoneLoginForm
              onSuccess={handleSuccess}
              onBack={() => setActiveTab("login")}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
