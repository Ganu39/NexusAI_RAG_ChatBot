"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && theme === "light";
  const label = isLight ? "Switch to black theme" : "Switch to light theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg p-2 btn-hover-shadow active:scale-95",
        "border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-elevated hover:border-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        className
      )}
      aria-label={label}
      title={label}
    >
      {isLight ? (
        <Sun className="h-4 w-4 text-accent transition-transform duration-200" />
      ) : (
        <Moon className="h-4 w-4 text-accent transition-transform duration-200" />
      )}
      {showLabel && (
        <span className="ml-2 text-xs font-mono font-medium capitalize">
          {mounted ? theme : "black"}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
