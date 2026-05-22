"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    <ToggleGroup
      aria-label="Dashboard view"
      // Track + inset pill, same token classes as the Progress/Activity tabs:
      // bg-secondary/50 (light) / bg-background (dark) track, bg-card selected
      // pill. Changing those tokens in globals.css updates both controls.
      variant="default"
      spacing={1}
      value={[value]}
      // Single-select: keep one view always selected — ignore the change if
      // clicking the active item would empty the group.
      onValueChange={(next) => {
        if (next[0]) onChange(next[0] as DashboardView);
      }}
      className="shrink-0 rounded-md bg-secondary/50 p-0.5 dark:bg-background"
    >
      {OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(
            "h-auto rounded-sm px-3 py-1.5 text-base text-muted-foreground hover:bg-transparent hover:text-foreground",
            "aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:hover:bg-card aria-pressed:hover:text-foreground",
            "data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:hover:bg-card data-[state=on]:hover:text-foreground",
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
