"use client";

import { useState } from "react";
import { signatureFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  PETITION_TIMELINE_META,
  sumInRange,
} from "@/lib/petition-timeline";
import { SectionHeading, sectionShell } from "./section-heading";

type Range = "day" | "week" | "month" | "sixMonths";

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

interface Bar {
  value: number;
  fullLabel: string;
  inWindow: boolean;
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

function buildDay(
  now: number,
  opened: number,
  closed: number | null,
): Bar[] {
  const today = FULL_FMT.format(new Date(now));
  const currentHour = new Date(now).getHours();
  const dayStart = startOfDay(now);
  return Array.from({ length: 24 }, (_, i) => {
    const slotStart = dayStart + i * HOUR_MS;
    const slotEnd = slotStart + HOUR_MS;
    const isFuture = i > currentHour;
    const isBeforeOpen = slotEnd <= opened;
    const isAfterClose = closed !== null && slotStart > closed;
    const inWindow = !isFuture && !isBeforeOpen && !isAfterClose;
    const value = inWindow ? sumInRange(slotStart, slotEnd) : 0;
    return { value, fullLabel: `${hourLabel(i)}, ${today}`, inWindow };
  });
}

function buildWeek(
  now: number,
  opened: number,
  closed: number | null,
): Bar[] {
  const weekStart = startOfWeekMon(now);
  const todayStart = startOfDay(now);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    const dStart = startOfDay(d.getTime());
    const dEnd = dStart + DAY_MS;
    const isFuture = dStart > todayStart;
    const isBeforeOpen = dEnd <= opened;
    const isAfterClose = closed !== null && dStart > closed;
    const inWindow = !isFuture && !isBeforeOpen && !isAfterClose;
    const value = inWindow ? sumInRange(dStart, dEnd) : 0;
    return { value, fullLabel: FULL_FMT.format(d), inWindow };
  });
}

function buildMonth(
  now: number,
  opened: number,
  closed: number | null,
): Bar[] {
  const nowDate = new Date(now);
  const year = nowDate.getFullYear();
  const month = nowDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStart = startOfDay(now);
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const d = new Date(year, month, day, 12, 0, 0, 0);
    const dStart = startOfDay(d.getTime());
    const dEnd = dStart + DAY_MS;
    const isFuture = dStart > todayStart;
    const isBeforeOpen = dEnd <= opened;
    const isAfterClose = closed !== null && dStart > closed;
    const inWindow = !isFuture && !isBeforeOpen && !isAfterClose;
    const value = inWindow ? sumInRange(dStart, dEnd) : 0;
    return { value, fullLabel: FULL_FMT.format(d), inWindow };
  });
}

function buildSixMonths(
  now: number,
  opened: number,
  closed: number | null,
): Bar[] {
  const nowDate = new Date(now);
  const year = nowDate.getFullYear();
  const currentMonth = nowDate.getMonth();
  return Array.from({ length: 6 }, (_, i) => {
    const monthOffset = 5 - i;
    const monthStart = new Date(year, currentMonth - monthOffset, 1, 0, 0, 0);
    const monthEnd = new Date(year, currentMonth - monthOffset + 1, 1, 0, 0, 0);
    const isFuture = monthStart.getTime() > now;
    const isBeforeOpen = monthEnd.getTime() <= opened;
    const isAfterClose = closed !== null && monthStart.getTime() > closed;
    const inWindow = !isFuture && !isBeforeOpen && !isAfterClose;
    const value = inWindow
      ? sumInRange(monthStart.getTime(), monthEnd.getTime())
      : 0;
    return {
      value,
      fullLabel: MONTH_FULL_FMT.format(monthStart),
      inWindow,
    };
  });
}

function axisLabels(range: Range, now: number): string[] {
  if (range === "day") {
    return ["12am", "6am", "noon", "6pm", "11pm"];
  }
  if (range === "week") {
    return DAY_NAMES_MON_FIRST;
  }
  if (range === "month") {
    const nowDate = new Date(now);
    const daysInMonth = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth() + 1,
      0,
    ).getDate();
    return ["1", "8", "15", "22", String(daysInMonth)];
  }
  // sixMonths
  const nowDate = new Date(now);
  const year = nowDate.getFullYear();
  const currentMonth = nowDate.getMonth();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, currentMonth - (5 - i), 1);
    return MONTH_NAMES_SHORT[d.getMonth()];
  });
}

function totalCaptionOf(range: Range): string {
  if (range === "day") return "Today";
  if (range === "week") return "This week";
  if (range === "month") return "This month";
  return "In the last 6 months";
}

export function ActivitySignaturesOverTime() {
  const [range, setRange] = useState<Range>("day");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Anchor to the capture moment rather than wall-clock now, so the chart
  // reads as a self-consistent snapshot regardless of when the dashboard is
  // viewed.
  const now = PETITION_TIMELINE_META.captured_at;
  const opened = PETITION_TIMELINE_META.opened_at;
  const closed = PETITION_TIMELINE_META.closed_at;

  const bars =
    range === "day"
      ? buildDay(now, opened, closed)
      : range === "week"
        ? buildWeek(now, opened, closed)
        : range === "month"
          ? buildMonth(now, opened, closed)
          : buildSixMonths(now, opened, closed);

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

  return (
    <section className={cn(sectionShell, "gap-4")}>
      <div className="flex items-center justify-between gap-2">
        <SectionHeading>Signatures over time</SectionHeading>
        <PreviewBadge />
      </div>

      <RangeToggle
        value={range}
        onChange={(v) => {
          setRange(v);
          setHoverIdx(null);
        }}
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold leading-none tabular-nums md:text-4xl">
            {signatureFormatter.format(total)}
          </span>
          <span className="text-xs text-muted-foreground md:text-sm">
            signatures
          </span>
        </div>
        <p className="text-xs leading-snug text-muted-foreground md:text-sm">
          {totalCaptionOf(range)}
          {peak.value > 0 && (
            <span className="text-muted-foreground/70">
              {" · "}Peak — {peak.fullLabel} (
              {signatureFormatter.format(peak.value)} signatures)
            </span>
          )}
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
            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoverIdx(i)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                aria-label={`${b.fullLabel}: ${signatureFormatter.format(b.value)} signatures`}
                className="flex-1 cursor-pointer rounded-[1px] bg-foreground transition-[opacity,height] duration-200"
                style={{
                  height: `${Math.max(6, (b.value / max) * 100)}%`,
                  opacity,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground/70 md:text-xs">
          {axisLabels(range, now).map((l, i) => (
            <span key={`${l}-${i}`}>{l}</span>
          ))}
        </div>
      </div>

      <p className="text-[11px] leading-snug text-muted-foreground/70 md:text-xs">
        {hovered
          ? `${hovered.fullLabel} — ${signatureFormatter.format(hovered.value)} signatures`
          : "Hover the bars to see other dates."}
      </p>
    </section>
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
              "rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors md:px-3 md:text-sm",
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

function PreviewBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 px-1.5 py-0 text-[10px] leading-4 font-medium text-muted-foreground"
      title="Real captured timeline for petition 751472, used as a single example regardless of which petition is loaded."
    >
      <span aria-hidden className="size-1 rounded-full bg-muted-foreground/60" />
      Preview
    </span>
  );
}
