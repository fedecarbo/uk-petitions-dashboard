"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { signatureFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  PETITION_TIMELINE_META,
  sumInRange,
} from "@/lib/petition-timeline";
import { SampleBadge, SectionHeading, sectionShell } from "./section-heading";

export type Range = "day" | "week" | "month" | "sixMonths";

const RANGES: Array<{ id: Range; label: string }> = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "sixMonths", label: "6 months" },
];

const DAY_NAMES_MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const FULL_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "short",
});
const MONTH_FULL_FMT = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});
const DAY_MONTH_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

interface Bar {
  value: number;
  fullLabel: string;
  inWindow: boolean;
  // Start-of-slot timestamp — drives click-to-drill navigation.
  ts: number;
}

function hourLabel(h: number): string {
  if (h === 0) return "midnight";
  if (h === 12) return "noon";
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

// Midnight of the Monday in the calendar week containing `ts`.
function startOfWeekMon(ts: number): Date {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Move the anchor backward by `offset` periods of the given range. Month
// arithmetic uses day 15 as the safe anchor so 31 May → 30 Apr doesn't bleed.
function computeAnchor(
  captured: number,
  range: Range,
  offset: number,
): number {
  const d = new Date(captured);
  if (range === "day") {
    d.setDate(d.getDate() - offset);
  } else if (range === "week") {
    d.setDate(d.getDate() - offset * 7);
  } else {
    d.setDate(15);
    d.setMonth(d.getMonth() - (range === "month" ? offset : offset * 6));
  }
  return d.getTime();
}

// A bar slot is in-window when it overlaps the petition's open period and
// lies at or before the capture moment. The anchor only decides which slots
// to draw; the petition's own bounds decide which of those have data.
function isInWindow(
  slotStart: number,
  slotEnd: number,
  opened: number,
  closed: number | null,
  captured: number,
): boolean {
  if (slotEnd <= opened) return false;
  if (slotStart > captured) return false;
  if (closed !== null && slotStart > closed) return false;
  return true;
}

function buildDay(
  anchor: number,
  opened: number,
  closed: number | null,
  captured: number,
): Bar[] {
  const today = FULL_FMT.format(new Date(anchor));
  const dayStart = startOfDay(anchor);
  return Array.from({ length: 24 }, (_, i) => {
    const slotStart = dayStart + i * HOUR_MS;
    const slotEnd = slotStart + HOUR_MS;
    const inWindow = isInWindow(slotStart, slotEnd, opened, closed, captured);
    const value = inWindow ? sumInRange(slotStart, slotEnd) : 0;
    return {
      value,
      fullLabel: `${hourLabel(i)}, ${today}`,
      inWindow,
      ts: slotStart,
    };
  });
}

function buildWeek(
  anchor: number,
  opened: number,
  closed: number | null,
  captured: number,
): Bar[] {
  const weekStart = startOfWeekMon(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    const dStart = startOfDay(d.getTime());
    const dEnd = dStart + DAY_MS;
    const inWindow = isInWindow(dStart, dEnd, opened, closed, captured);
    const value = inWindow ? sumInRange(dStart, dEnd) : 0;
    return {
      value,
      fullLabel: FULL_FMT.format(d),
      inWindow,
      ts: dStart,
    };
  });
}

function buildMonth(
  anchor: number,
  opened: number,
  closed: number | null,
  captured: number,
): Bar[] {
  const anchorDate = new Date(anchor);
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const d = new Date(year, month, day, 12, 0, 0, 0);
    const dStart = startOfDay(d.getTime());
    const dEnd = dStart + DAY_MS;
    const inWindow = isInWindow(dStart, dEnd, opened, closed, captured);
    const value = inWindow ? sumInRange(dStart, dEnd) : 0;
    return {
      value,
      fullLabel: FULL_FMT.format(d),
      inWindow,
      ts: dStart,
    };
  });
}

function buildSixMonths(
  anchor: number,
  opened: number,
  closed: number | null,
  captured: number,
): Bar[] {
  const anchorDate = new Date(anchor);
  const year = anchorDate.getFullYear();
  const currentMonth = anchorDate.getMonth();
  return Array.from({ length: 6 }, (_, i) => {
    const monthOffset = 5 - i;
    const monthStart = new Date(year, currentMonth - monthOffset, 1, 0, 0, 0);
    const monthEnd = new Date(year, currentMonth - monthOffset + 1, 1, 0, 0, 0);
    const inWindow = isInWindow(
      monthStart.getTime(),
      monthEnd.getTime(),
      opened,
      closed,
      captured,
    );
    const value = inWindow
      ? sumInRange(monthStart.getTime(), monthEnd.getTime())
      : 0;
    return {
      value,
      fullLabel: MONTH_FULL_FMT.format(monthStart),
      inWindow,
      ts: monthStart.getTime(),
    };
  });
}

function axisLabels(range: Range, anchor: number): string[] {
  if (range === "day") {
    return ["12am", "6am", "noon", "6pm", "11pm"];
  }
  if (range === "week") {
    return DAY_NAMES_MON_FIRST;
  }
  if (range === "month") {
    const d = new Date(anchor);
    const daysInMonth = new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      0,
    ).getDate();
    return ["1", "8", "15", "22", String(daysInMonth)];
  }
  // sixMonths
  const d = new Date(anchor);
  const year = d.getFullYear();
  const currentMonth = d.getMonth();
  return Array.from({ length: 6 }, (_, i) => {
    const m = new Date(year, currentMonth - (5 - i), 1);
    return MONTH_NAMES_SHORT[m.getMonth()];
  });
}

function periodLabel(range: Range, anchor: number): string {
  if (range === "day") {
    return FULL_FMT.format(new Date(anchor));
  }
  if (range === "week") {
    return `Week of ${DAY_MONTH_FMT.format(startOfWeekMon(anchor))}`;
  }
  if (range === "month") {
    return MONTH_FULL_FMT.format(new Date(anchor));
  }
  // sixMonths — first month of the window through the anchor month.
  const d = new Date(anchor);
  const year = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month - 5, 1);
  const last = new Date(year, month, 1);
  return `${MONTH_NAMES_SHORT[first.getMonth()]} ${first.getFullYear()} – ${MONTH_NAMES_SHORT[last.getMonth()]} ${last.getFullYear()}`;
}

// Offsets used when drilling from a larger range into a smaller one — both
// measured backward from the capture moment so they slot straight into
// `setPeriodOffset` for the target range.
export function dayOffsetFrom(captured: number, target: number): number {
  const cap = startOfDay(captured);
  const tgt = startOfDay(target);
  return Math.max(0, Math.round((cap - tgt) / DAY_MS));
}

export function monthOffsetFrom(captured: number, target: number): number {
  const cap = new Date(captured);
  const tgt = new Date(target);
  return Math.max(
    0,
    (cap.getFullYear() - tgt.getFullYear()) * 12 +
      (cap.getMonth() - tgt.getMonth()),
  );
}

// End-of-window timestamp for the period starting at `anchor` (used to decide
// whether stepping further back still touches the petition's open span).
function periodEnd(range: Range, anchor: number): number {
  if (range === "day") {
    return startOfDay(anchor) + DAY_MS;
  }
  if (range === "week") {
    return startOfWeekMon(anchor).getTime() + 7 * DAY_MS;
  }
  // month / sixMonths — end of the anchor's month (the rightmost bar).
  const d = new Date(anchor);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

interface ActivitySignaturesOverTimeProps {
  range: Range;
  setRange: (r: Range) => void;
  periodOffset: number;
  setPeriodOffset: (n: number | ((prev: number) => number)) => void;
}

export function ActivitySignaturesOverTime({
  range,
  setRange,
  periodOffset,
  setPeriodOffset,
}: ActivitySignaturesOverTimeProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const captured = PETITION_TIMELINE_META.captured_at;
  const opened = PETITION_TIMELINE_META.opened_at;
  const closed = PETITION_TIMELINE_META.closed_at;

  const anchor = computeAnchor(captured, range, periodOffset);

  const bars =
    range === "day"
      ? buildDay(anchor, opened, closed, captured)
      : range === "week"
        ? buildWeek(anchor, opened, closed, captured)
        : range === "month"
          ? buildMonth(anchor, opened, closed, captured)
          : buildSixMonths(anchor, opened, closed, captured);

  const max = Math.max(...bars.map((b) => (b.inWindow ? b.value : 0)), 1);
  const total = bars.reduce((s, b) => s + b.value, 0);

  let peakIdx = -1;
  for (let i = 0; i < bars.length; i++) {
    if (!bars[i].inWindow) continue;
    if (peakIdx === -1 || bars[i].value > bars[peakIdx].value) peakIdx = i;
  }
  if (peakIdx === -1) peakIdx = 0;

  const peak = bars[peakIdx];
  const isHovering = hoverIdx !== null;
  const hovered = isHovering ? bars[hoverIdx] : null;

  const canStepForward = periodOffset > 0;
  const nextBackAnchor = computeAnchor(captured, range, periodOffset + 1);
  const canStepBack = periodEnd(range, nextBackAnchor) > opened;

  const stepBack = () => {
    if (!canStepBack) return;
    setPeriodOffset((o) => o + 1);
    setHoverIdx(null);
  };
  const stepForward = () => {
    if (!canStepForward) return;
    setPeriodOffset((o) => Math.max(0, o - 1));
    setHoverIdx(null);
  };

  const drillDown = (barTs: number) => {
    if (range === "day") return;
    const targetRange: Range = range === "sixMonths" ? "month" : "day";
    const offset =
      targetRange === "month"
        ? monthOffsetFrom(captured, barTs)
        : dayOffsetFrom(captured, barTs);
    setRange(targetRange);
    setPeriodOffset(offset);
    setHoverIdx(null);
  };

  const canDrill = range !== "day";

  return (
    <section className={cn(sectionShell, "gap-4")}>
      <div className="flex items-center justify-between gap-2">
        <SectionHeading>Signatures over time</SectionHeading>
        <SampleBadge />
      </div>

      <RangeToggle
        value={range}
        onChange={(v) => {
          setRange(v);
          setHoverIdx(null);
          setPeriodOffset(0);
        }}
      />

      <div className="flex flex-col gap-1">
        <PeriodNavigator
          label={periodLabel(range, anchor)}
          canStepBack={canStepBack}
          canStepForward={canStepForward}
          onStepBack={stepBack}
          onStepForward={stepForward}
        />
        <p className="text-base text-muted-foreground">
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {signatureFormatter.format(total)}
          </span>{" "}
          signatures
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div
          className="flex h-24 items-end gap-[2px] md:h-28"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {bars.map((b, i) => {
            if (!b.inWindow) {
              return (
                <div
                  key={i}
                  aria-hidden
                  className="pointer-events-none flex-1 rounded-[1px] bg-foreground/15"
                  style={{ height: "6%" }}
                />
              );
            }
            const isPeak = i === peakIdx;
            const isHovered = hoverIdx === i;
            const opacity = isHovered ? 1 : isPeak ? 0.9 : 0.55;
            const drillLabel = canDrill
              ? range === "sixMonths"
                ? `: open ${b.fullLabel}`
                : `: open this day`
              : "";
            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoverIdx(i)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                onClick={canDrill ? () => drillDown(b.ts) : undefined}
                onKeyDown={
                  canDrill
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          drillDown(b.ts);
                        }
                      }
                    : undefined
                }
                aria-label={`${b.fullLabel}: ${signatureFormatter.format(b.value)} signatures${drillLabel}`}
                className={cn(
                  "flex-1 rounded-[1px] bg-foreground transition-[opacity,height] duration-200",
                  canDrill ? "cursor-pointer" : "cursor-default",
                )}
                style={{
                  height: `${Math.max(6, (b.value / max) * 100)}%`,
                  opacity,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-sm tabular-nums text-muted-foreground/70">
          {axisLabels(range, anchor).map((l, i) => (
            <span key={`${l}-${i}`}>{l}</span>
          ))}
        </div>
      </div>

      <p className="text-sm leading-snug text-muted-foreground/70">
        {hovered
          ? `${hovered.fullLabel} — ${signatureFormatter.format(hovered.value)} signatures`
          : peak.value > 0
            ? `Peak — ${peak.fullLabel} (${signatureFormatter.format(peak.value)} signatures)`
            : "No signatures in this period"}
      </p>
    </section>
  );
}

function PeriodNavigator({
  label,
  canStepBack,
  canStepForward,
  onStepBack,
  onStepForward,
}: {
  label: string;
  canStepBack: boolean;
  canStepForward: boolean;
  onStepBack: () => void;
  onStepForward: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-2xl font-bold leading-none tabular-nums">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <NavButton
          ariaLabel="Previous period"
          disabled={!canStepBack}
          onClick={onStepBack}
        >
          <ChevronLeft size={16} />
        </NavButton>
        <NavButton
          ariaLabel="Next period"
          disabled={!canStepForward}
          onClick={onStepForward}
        >
          <ChevronRight size={16} />
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({
  ariaLabel,
  disabled,
  onClick,
  children,
}: {
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function RangeToggle({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Time range"
      className="inline-flex self-start rounded-md border border-border/70 bg-card p-0.5"
    >
      {RANGES.map((r) => {
        const active = r.id === value;
        return (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r.id)}
            className={cn(
              "rounded-[5px] px-2.5 py-1 text-base font-medium transition-colors md:px-3",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

