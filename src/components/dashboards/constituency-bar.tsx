"use client";

import type { KeyboardEvent } from "react";
import { signatureFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ConstituencyBarProps {
  name: string;
  mp: string | null;
  signatureCount: number;
  widthPct: number;
  isActive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: () => void;
}

export function ConstituencyBar({
  name,
  mp,
  signatureCount,
  widthPct,
  isActive = false,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onClick,
}: ConstituencyBarProps) {
  const interactive = Boolean(onClick || onMouseEnter);

  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <li
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        "relative overflow-hidden rounded-md border border-border/40 transition-colors",
        interactive &&
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        onClick && "cursor-pointer hover:border-border",
        !onClick && interactive && "cursor-default",
        isActive && "border-primary/40 bg-primary/[0.06]",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-primary/10"
        style={{ width: `${widthPct}%` }}
      />
      <div className="relative flex items-baseline justify-between gap-3 px-3 py-2 lg:px-4 lg:py-2.5">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-medium">
            {name}
          </span>
          {mp && (
            <span className="truncate text-base text-muted-foreground">
              {mp}
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono text-base font-semibold tabular-nums">
          {signatureFormatter.format(signatureCount)}
        </span>
      </div>
    </li>
  );
}
