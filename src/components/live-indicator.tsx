"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  lastUpdated: number | null;
  isRefreshing: boolean;
}

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

export function LiveIndicator({
  lastUpdated,
  isRefreshing,
}: LiveIndicatorProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const label = isRefreshing
    ? "Updating…"
    : lastUpdated
      ? `Updated ${formatAge(now - lastUpdated)}`
      : "Loading…";

  return (
    <div className="flex shrink-0 items-center gap-2 text-base font-medium text-muted-foreground">
      <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full bg-live opacity-75",
            isRefreshing && "animate-ping",
          )}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-live md:h-2.5 md:w-2.5" />
      </span>
      <span className="hidden whitespace-nowrap md:inline">{label}</span>
    </div>
  );
}
