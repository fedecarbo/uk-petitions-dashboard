"use client";

import { useMemo, useState } from "react";
import type { PetitionAttributes } from "@/lib/petitions-api";
import { cn } from "@/lib/utils";
import { PetitionProgress } from "@/components/dashboards/stats/petition-progress";
import { Activity } from "@/components/dashboards/stats/activity";

interface StatCarouselProps {
  attrs: PetitionAttributes;
  className?: string;
}

interface CardDef {
  id: string;
  label: string;
  render: () => React.ReactNode;
}

export function StatCarousel({ attrs, className }: StatCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const cards = useMemo<CardDef[]>(
    () => [
      {
        id: "progress",
        label: "Progress",
        render: () => <PetitionProgress attrs={attrs} />,
      },
      {
        id: "activity",
        label: "Activity",
        render: () => <Activity />,
      },
    ],
    [attrs],
  );

  const activeCard = cards[activeIndex];

  return (
    <div className={cn("flex flex-col bg-card", className)}>
      <div className="shrink-0 border-b border-border">
        <div
          role="tablist"
          aria-label="Petition statistics"
          className="flex"
        >
          {cards.map((card, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`stat-panel-${card.id}`}
                id={`stat-tab-${card.id}`}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative flex-1 px-3 py-3 text-base font-medium transition-colors lg:py-4",
                  idx > 0 && "border-l border-border",
                  isActive
                    ? "bg-card text-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {card.label}
                {isActive && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-card"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`stat-panel-${activeCard.id}`}
        aria-labelledby={`stat-tab-${activeCard.id}`}
        className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-8"
      >
        {activeCard.render()}
      </div>
    </div>
  );
}
