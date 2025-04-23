import { FC, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, Home, FileSearch, AlertCircle } from "lucide-react";
import { cn } from "@repo/ui/utils";
import { motion } from "framer-motion";

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  className?: string;
}

export const ErrorPage: FC<ErrorPageProps> = ({
  statusCode = 404,
  title = "Page Not Found",
  description = "Sorry, the page you're looking for doesn't exist or has been moved.",
  showHomeButton = true,
  showBackButton = true,
  className,
}) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-screen bg-neutral-900 px-4 py-12 text-white overflow-hidden",
        className
      )}
    >
      {mounted && (
        <motion.div
          className="flex flex-col items-center max-w-md text-center relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Visual element - broken path illustration */}
          <motion.div variants={itemVariants} className="mb-8 relative">
            <div className="absolute -inset-6 rounded-full opacity-10 bg-[#AEE301] blur-2xl"></div>
            <div className="relative flex items-center justify-center">
              <svg
                width="160"
                height="100"
                viewBox="0 0 160 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-neutral-800"
              >
                <path
                  d="M10,50 L40,50 L60,30 L70,70 L90,10 L110,90 L150,50"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="77" cy="50" r="12" fill="#e31001" />
                <circle cx="77" cy="50" r="6" fill="#AEE301" />
              </svg>
              <div className="absolute right-0 bottom-0">
                {statusCode === 404 ? (
                  <FileSearch className="h-12 w-12 text-[#e31001]" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-[#e31001]" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Error details */}
          <motion.div variants={itemVariants} className="space-y-1 mb-6">
            <div className="flex items-center justify-center gap-3">
              <motion.h1
                className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#e31001] to-[#AEE301]"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{
                  repeat: Infinity,
                  repeatType: "mirror",
                  duration: 4,
                }}
              >
                {statusCode}
              </motion.h1>
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-neutral-400 text-sm max-w-sm mx-auto">
              {description}
            </p>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto"
          >
            {showHomeButton && (
              <Button className="w-full bg-[#e31001] hover:bg-[#c50e00] text-white rounded-xl h-12">
                <Link
                  to="/"
                  className="flex items-center justify-center w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            )}

            {showBackButton && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="w-full border-neutral-800 bg-neutral-900/50 text-white hover:bg-neutral-800 rounded-xl h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#e31001] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#AEE301] opacity-5 rounded-full blur-3xl"></div>

        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/5 w-1 h-1 bg-white rounded-full"></div>
      </div>
    </div>
  );
};

export default ErrorPage;
