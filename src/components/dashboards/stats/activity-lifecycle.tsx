"use client";

import { useEffect, useState } from "react";
import type { PetitionAttributes } from "@/lib/petitions-api";
import { formatDateShort } from "@/lib/format-date";
import { isPetitionClosed } from "@/lib/petition-thresholds";
import { cn } from "@/lib/utils";
import { SectionHeading, sectionShell } from "./section-heading";

interface Props {
  attrs: PetitionAttributes;
}

const DAY_MS = 86_400_000;

function parseMs(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

export function ActivityLifecycle({ attrs }: Props) {
  // Snapshot now on mount; refresh once a minute so the today indicator drifts
  // visibly. Functional initialiser sidesteps the react-hooks/purity rule.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const opened = parseMs(attrs.opened_at);
  const closing = parseMs(attrs.closing_date);
  const closedAt = parseMs(attrs.closed_at);
  const closed = isPetitionClosed(attrs);

  if (!opened) {
    return (
      <section className={cn(sectionShell, "gap-3")}>
        <SectionHeading>Lifecycle</SectionHeading>
        <p className="text-sm text-muted-foreground">
          This petition has not opened yet.
        </p>
      </section>
    );
  }

  // For closed petitions the strip ends at closed_at. For open ones, at the
  // scheduled closing date. If neither makes sense, fall back to today.
  const rightEdge = closed && closedAt ? closedAt : (closing ?? now);
  if (rightEdge <= opened) {
    return (
      <section className={cn(sectionShell, "gap-3")}>
        <SectionHeading>Lifecycle</SectionHeading>
        <p className="text-sm text-muted-foreground">
          Lifecycle becomes available once a closing date is set.
        </p>
      </section>
    );
  }

  const spanMs = rightEdge - opened;
  const pos = (t: number) =>
    Math.max(0, Math.min(1, (t - opened) / spanMs));
  const todayPos = pos(Math.min(now, rightEdge));

  const totalDays = Math.max(1, Math.round(spanMs / DAY_MS));
  const elapsedDays = Math.max(
    0,
    Math.round((Math.min(now, rightEdge) - opened) / DAY_MS),
  );
  const remainingDays = Math.max(0, totalDays - elapsedDays);

  const reach10k = parseMs(attrs.response_threshold_reached_at);
  const reach100k = parseMs(attrs.debate_threshold_reached_at);

  const milestoneNotes: string[] = [];
  if (reach10k) {
    const days = Math.max(1, Math.round((reach10k - opened) / DAY_MS));
    milestoneNotes.push(
      `Reached 10,000 in ${days.toLocaleString("en-GB")} ${days === 1 ? "day" : "days"} (${formatDateShort(attrs.response_threshold_reached_at)}).`,
    );
  }
  if (reach100k && reach10k) {
    const days = Math.max(1, Math.round((reach100k - reach10k) / DAY_MS));
    milestoneNotes.push(
      `Reached 100,000 ${days.toLocaleString("en-GB")} ${days === 1 ? "day" : "days"} later (${formatDateShort(attrs.debate_threshold_reached_at)}).`,
    );
  }

  return (
    <section className={cn(sectionShell, "gap-5")}>
      <SectionHeading>Lifecycle</SectionHeading>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-bold leading-none tracking-tight tabular-nums md:text-5xl lg:text-6xl">
            {closed
              ? "Closed"
              : `Day ${elapsedDays.toLocaleString("en-GB")}`}
          </span>
          {!closed && (
            <span className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base">
              of {totalDays.toLocaleString("en-GB")}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground md:text-base">
          {closed
            ? `Ran for ${elapsedDays.toLocaleString("en-GB")} days`
            : `${remainingDays.toLocaleString("en-GB")} ${remainingDays === 1 ? "day" : "days"} left to sign`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative h-1.5 w-full bg-primary/10">
          <div
            className={cn(
              "h-full transition-[width] duration-500",
              closed ? "bg-muted-foreground/60" : "bg-primary",
            )}
            style={{ width: `${todayPos * 100}%` }}
          />
          {reach10k && reach10k > opened && reach10k <= rightEdge && (
            <MilestoneDot position={pos(reach10k)} title="10,000 signatures reached" />
          )}
          {reach100k && reach100k > opened && reach100k <= rightEdge && (
            <MilestoneDot position={pos(reach100k)} title="100,000 signatures reached" />
          )}
          {!closed && <TodayLine position={todayPos} />}
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] tabular-nums md:text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">Opened</span>
            <span className="text-muted-foreground">
              {formatDateShort(attrs.opened_at)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 text-center">
            {!closed && (
              <>
                <span className="font-medium text-foreground">Today</span>
                <span className="text-muted-foreground">
                  Day {elapsedDays.toLocaleString("en-GB")}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="font-medium text-foreground">
              {closed ? "Closed" : "Closes"}
            </span>
            <span className="text-muted-foreground">
              {formatDateShort(closed ? attrs.closed_at : attrs.closing_date)}
            </span>
          </div>
        </div>
      </div>

      {milestoneNotes.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs leading-snug text-muted-foreground md:text-sm">
          {milestoneNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MilestoneDot({
  position,
  title,
}: {
  position: number;
  title: string;
}) {
  return (
    <span
      aria-label={title}
      className="absolute top-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
      style={{ left: `${position * 100}%` }}
    />
  );
}

function TodayLine({ position }: { position: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-y-2 w-0.5 -translate-x-1/2 bg-foreground"
      style={{ left: `${position * 100}%` }}
    />
  );
}
