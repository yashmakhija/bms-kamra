import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { AlertCircle } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, error: loginError, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    if (!email.trim()) {
      setValidationError("Email is required");
      return false;
    }
    
    if (!password.trim()) {
      setValidationError("Password is required");
      return false;
    }
    
    setValidationError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login({ email, password });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Image with gradient overlay */}
      <div className="hidden lg:block lg:pt-40 xl:pt-14 relative bg-gradient-to-b from-[#111111] to-[#000051] overflow-hidden w-1/2  items-center justify-center">
        <div className="absolute inset-0 pacity-90 z-10"></div>
        <img 
          src="/auth-cover.png" 
          alt="Kunal Kamra on stage" 
          className="object-cover xl:w-[620px] xl:h-[931px] lg:w-[520px] lg:h-[831px] mx-auto"
        />
       
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#111111]">
        <div className="w-full max-w-md px-6">
          <div className="flex mb-6">
            <div className="w-9 h-9 relative bg-[#fd6037] rounded-[75px] blur-[0px] overflow-hidden ">
            <Link to="/"><img 
                src="/main-logo.png" 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </Link>
            </div>
          </div>

          <h2 className="text-3xl justify-center font-bold text-white mb-8 leading-10">
            Welcome Back
          </h2>

          {(loginError || validationError) && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-800/30 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{loginError || validationError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2 px-1 self-stretch justify-start text-white/80 text-base font-normal ">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#222222] border-0 text-white h-14 rounded-3xl px-4 outline-none focus:outline-none focus:ring-0"
                placeholder="john.doe@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block self-stretch justify-start px-1 text-white/80 text-base font-normal  mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#222222] border-0 text-white h-14 rounded-3xl px-4 outline-none focus:outline-none focus:ring-0"
                placeholder="••••••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-[#f2f900] rounded-2xl inline-flex justify-center items-center gap-2 overflow-hidden"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            
            <div className="text-center">
              <p className="text-white/60 text-sm">
                Don't have an account?{" "}
                <Link to="/auth/signup" className="text-[#f2f900] hover:text-[#f2f900]/80 transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
            
            <p className="text-sm text-white/60 text-center mt-2">
              By clicking on "login" you agree to our{" "}
              <Link to="/terms" className="text-white underline">
                Terms of Service
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
