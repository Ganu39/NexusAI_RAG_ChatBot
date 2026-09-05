"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export type NexusLogoProps = {
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
  subtitle?: string;
  className?: string;
};

const sizeConfig = {
  xs: {
    container: "h-6 w-6 rounded-md",
    svg: "h-3.5 w-3.5",
    title: "text-sm",
    subtitle: "text-[9px]",
    gap: "gap-2",
  },
  sm: {
    container: "h-8 w-8 rounded-xl",
    svg: "h-4.5 w-4.5",
    title: "text-base",
    subtitle: "text-[10px]",
    gap: "gap-2.5",
  },
  md: {
    container: "h-9 w-9 rounded-xl",
    svg: "h-5 w-5",
    title: "text-lg",
    subtitle: "text-[10px]",
    gap: "gap-2.5",
  },
  lg: {
    container: "h-11 w-11 rounded-xl",
    svg: "h-6 w-6",
    title: "text-xl",
    subtitle: "text-xs",
    gap: "gap-3",
  },
};

export function NexusMonogram({
  className,
  gradientId,
}: {
  className?: string;
  gradientId?: string;
}) {
  const generatedId = useId();
  const id = gradientId || `nexus-mono-${generatedId.replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={id}
          x1="4"
          y1="3"
          x2="20"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <path
        d="M4 3H8.5L15.5 13.5V3H20V21H15.5L8.5 10.5V21H4V3Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

export function NexusLogo({
  size = "md",
  showText = false,
  subtitle,
  className,
}: NexusLogoProps) {
  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className={cn("flex items-center", config.gap, className)}
      {...(!showText
        ? { role: "img", "aria-label": "NexusAI" }
        : { "aria-label": undefined })}
    >
      {/* Brand Monogram Badge */}
      <div
        className={cn(
          "flex items-center justify-center shrink-0",
          "bg-gradient-to-br from-indigo-950/50 via-[#0E131F] to-[#080B11]",
          "border border-indigo-500/30 shadow-sm shadow-indigo-500/10",
          config.container
        )}
        aria-hidden="true"
      >
        <NexusMonogram className={config.svg} />
      </div>

      {/* Typography Lockup */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div
            className={cn(
              "font-bold tracking-tight text-white leading-tight font-mono",
              config.title
            )}
          >
            Nexus
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent font-extrabold">
              AI
            </span>
          </div>
          {subtitle && (
            <span
              className={cn(
                "uppercase tracking-wider text-cyan-400 font-mono font-medium leading-none mt-0.5",
                config.subtitle
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default NexusLogo;
