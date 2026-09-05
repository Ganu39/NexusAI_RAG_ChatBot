import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo",
}: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      border: "border-indigo-500/20",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/20",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
    },
  };

  const style = colorMap[color] || colorMap.indigo;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {title}
        </span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.bg} ${style.text} border ${style.border}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl font-mono">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
