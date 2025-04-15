"use client";

import { ReactNode } from "react";
import { cn } from "./utils";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
  variant?: "default" | "ghost" | "custom";
}

export const Button = ({ children, className, appName }: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  return (
    <button
      className={cn(baseStyles, className)}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};
