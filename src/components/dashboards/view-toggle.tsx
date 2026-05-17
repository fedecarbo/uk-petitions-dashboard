"use client";

import { cn } from "@/lib/utils";

export type DashboardView = "stats" | "map";

interface ViewToggleProps {
  value: DashboardView;
  onChange: (value: DashboardView) => void;
}

const OPTIONS: Array<{ value: DashboardView; label: string }> = [
  { value: "stats", label: "Stats" },
  { value: "map", label: "Map" },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard view"
      className="flex overflow-hidden rounded-md border border-border bg-muted text-xs font-medium md:text-sm"
    >
      {OPTIONS.map((option, idx) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1.5 transition-colors lg:px-4 lg:py-2",
              idx > 0 && "border-l border-border",
              active
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
