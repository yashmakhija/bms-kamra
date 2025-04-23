import { FC, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import { Home, Clock, Calendar, Bell } from "lucide-react";
import { cn } from "@repo/ui/utils";
import { motion } from "framer-motion";

interface ComingSoonProps {
  title?: string;
  subtitle?: string;
  description?: string;
  date?: string; // Expected launch date
  showHomeButton?: boolean;
  showNotifyButton?: boolean; // For newsletter signup
  className?: string;
  onNotifyClick?: () => void; // Callback for notification button
}

export const ComingSoon: FC<ComingSoonProps> = ({
  title = "Coming Soon",
  subtitle = "We're working on something amazing",
  description = "This section is currently under development. We're working hard to bring you an exceptional experience.",
  date,
  showHomeButton = true,
  showNotifyButton = true,
  className,
  onNotifyClick,
}) => {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);

    // Calculate time left if a date is provided
    if (date) {
      const calculateTimeLeft = () => {
        const difference = new Date(date).getTime() - new Date().getTime();

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          });
        }
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);

      return () => clearInterval(timer);
    }
  }, [date]);

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
          className="flex flex-col items-center max-w-2xl text-center relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo animation */}
          <motion.div
            variants={itemVariants}
            className="mb-8 relative"
            animate={{
              y: [0, -10, 0],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            <div className="absolute -inset-6 rounded-full opacity-10 bg-[#AEE301] blur-2xl"></div>
            <div className="relative flex items-center justify-center">
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-[#e31001] to-[#AEE301] p-[3px]">
                <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-[#AEE301]" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Title and description */}
          <motion.div variants={itemVariants} className="space-y-3 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#e31001] to-[#AEE301]">
              {title}
            </h1>
            <h2 className="text-xl md:text-2xl font-medium text-white">
              {subtitle}
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto">{description}</p>
          </motion.div>

          {/* Countdown timer - only show if date is provided */}
          {date && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex gap-4 justify-center flex-wrap">
                <div className="bg-neutral-800 px-6 py-4 rounded-xl text-center min-w-[90px]">
                  <div className="text-3xl font-bold text-white">
                    {timeLeft.days}
                  </div>
                  <div className="text-xs text-neutral-400 uppercase tracking-wider">
                    Days
                  </div>
                </div>
                <div className="bg-neutral-800 px-6 py-4 rounded-xl text-center min-w-[90px]">
                  <div className="text-3xl font-bold text-white">
                    {timeLeft.hours}
                  </div>
                  <div className="text-xs text-neutral-400 uppercase tracking-wider">
                    Hours
                  </div>
                </div>
                <div className="bg-neutral-800 px-6 py-4 rounded-xl text-center min-w-[90px]">
                  <div className="text-3xl font-bold text-white">
                    {timeLeft.minutes}
                  </div>
                  <div className="text-xs text-neutral-400 uppercase tracking-wider">
                    Minutes
                  </div>
                </div>
                <div className="bg-neutral-800 px-6 py-4 rounded-xl text-center min-w-[90px]">
                  <div className="text-3xl font-bold text-white">
                    {timeLeft.seconds}
                  </div>
                  <div className="text-xs text-neutral-400 uppercase tracking-wider">
                    Seconds
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-neutral-400">
                <Calendar className="h-4 w-4" />
                <span>
                  Expected launch:{" "}
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto"
          >
            {showNotifyButton && (
              <Button
                onClick={onNotifyClick}
                className="w-full bg-[#e31001] hover:bg-[#c50e00] text-white rounded-xl h-12"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notify Me
              </Button>
            )}

            {showHomeButton && (
              <Button
                variant="outline"
                className="w-full border-neutral-700 text-white hover:bg-neutral-800 rounded-xl h-12"
              >
                <Link
                  to="/"
                  className="flex items-center justify-center w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/5 w-1 h-1 bg-white rounded-full"></div>

        {/* Animated pulse rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {mounted &&
            Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-[#AEE301]/10"
                initial={{ width: 100, height: 100, opacity: 0 }}
                animate={{
                  width: [100, 600],
                  height: [100, 600],
                  opacity: [0.5, 0],
                  scale: [1, 1.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 1.5,
                  ease: "easeOut",
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
