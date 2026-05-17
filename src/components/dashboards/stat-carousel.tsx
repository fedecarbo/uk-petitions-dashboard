"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PetitionAttributes } from "@/lib/petitions-api";
import type { PetitionHistorySample } from "@/hooks/use-petition";
import { cn } from "@/lib/utils";
import { Geography } from "@/components/dashboards/stats/geography";
import { PetitionProgress } from "@/components/dashboards/stats/petition-progress";
import { Activity } from "@/components/dashboards/stats/activity";

const ROTATION_MS = 8_000;
const TICK_MS = 100;

interface StatCarouselProps {
  attrs: PetitionAttributes;
  history: PetitionHistorySample[];
  className?: string;
}

interface CardDef {
  id: string;
  label: string;
  render: () => React.ReactNode;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function StatCarousel({ attrs, history, className }: StatCarouselProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pinned, setPinned] = useState(false);
  const pin = useCallback(() => setPinned(true), []);

  const cards = useMemo<CardDef[]>(
    () => [
      {
        id: "progress",
        label: "Progress",
        render: () => <PetitionProgress attrs={attrs} onInteract={pin} />,
      },
      {
        id: "geography",
        label: "Geography",
        render: () => <Geography attrs={attrs} />,
      },
      {
        id: "activity",
        label: "Activity",
        render: () => <Activity history={history} />,
      },
    ],
    [attrs, history, pin],
  );

  const [hovering, setHovering] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(0);

  const rotating = !pinned && !hovering && !reducedMotion;

  useEffect(() => {
    if (!rotating) return;
    startedAtRef.current = Date.now();
    const tick = window.setInterval(() => {
      const e = Date.now() - startedAtRef.current;
      if (e >= ROTATION_MS) {
        setActiveIndex((i) => (i + 1) % cards.length);
        startedAtRef.current = Date.now();
        setElapsed(0);
      } else {
        setElapsed(e);
      }
    }, TICK_MS);
    return () => window.clearInterval(tick);
  }, [rotating, cards.length]);

  const activeCard = cards[activeIndex];
  const progressPct = rotating
    ? Math.min(100, (elapsed / ROTATION_MS) * 100)
    : 0;

  function handleTabClick(idx: number) {
    if (idx === activeIndex) {
      setPinned((p) => !p);
      return;
    }
    setActiveIndex(idx);
    setPinned(true);
  }

  return (
    <div className={cn("flex flex-col bg-card", className)}>
      <div className="relative shrink-0 border-b border-border">
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
                onClick={() => handleTabClick(idx)}
                className={cn(
                  "flex-1 px-3 py-3 text-xs font-medium transition-colors md:text-sm lg:py-4 lg:text-base",
                  idx > 0 && "border-l border-border",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                {card.label}
              </button>
            );
          })}
        </div>
        {rotating && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-px bg-foreground/50 transition-[width] duration-100"
            style={{ width: `${progressPct}%` }}
          />
        )}
      </div>

      <div
        role="tabpanel"
        id={`stat-panel-${activeCard.id}`}
        aria-labelledby={`stat-tab-${activeCard.id}`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-8"
      >
        {activeCard.render()}
      </div>
    </div>
  );
}
