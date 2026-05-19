"use client";

import { useEffect, useState } from "react";
import type { PetitionAttributes } from "@/lib/petitions-api";
import { signatureFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionHeading, sectionShell } from "./section-heading";

type Range = "day" | "week" | "month" | "lifetime";

const RANGES: Array<{ id: Range; label: string }> = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "lifetime", label: "Lifetime" },
];

// Above this many days open, switch the Lifetime view from one bar per day to
// one bar per week so bars stay readable in the narrow panel.
const LIFETIME_WEEKLY_THRESHOLD = 60;

// Daily rhythm: low overnight, two daytime peaks, evening crest.
const HOUR_WEIGHTS = [
  0.10, 0.08, 0.06, 0.06, 0.08, 0.15,
  0.30, 0.55, 0.80, 0.90, 0.90, 0.85,
  0.60, 0.75, 0.85, 0.90, 0.85, 0.70,
  0.65, 0.90, 1.00, 0.95, 0.70, 0.40,
];

// Weekly rhythm by day-of-week (Sun=0 … Sat=6).
const DAY_WEIGHTS = [0.65, 1.0, 1.15, 1.05, 1.0, 0.85, 0.7];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DAY_MS = 86_400_000;
const FULL_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "short",
});
const SHORT_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

interface Bar {
  value: number;
  fullLabel: string;
}

interface Props {
  attrs: PetitionAttributes;
}

function noiseAt(seed: number, i: number, scale: number): number {
  const v =
    Math.sin(seed * 7.913 + i * 2.137) * 0.5 +
    Math.cos(seed * 11.71 + i * 3.503) * 0.5;
  return v * scale;
}

function hashString(s: string | null | undefined): number {
  if (!s) return 1_234_567;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function hourLabel(h: number): string {
  if (h === 0) return "midnight";
  if (h === 12) return "noon";
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

function buildDay(dailyAvg: number, seed: number, now: number): Bar[] {
  const totalW = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);
  const today = FULL_FMT.format(new Date(now));
  return HOUR_WEIGHTS.map((w, i) => {
    const noise = noiseAt(seed, i, 0.18);
    const value = Math.max(
      0,
      Math.round(((dailyAvg * w) / totalW) * (1 + noise)),
    );
    return { value, fullLabel: `${hourLabel(i)}, ${today}` };
  });
}

function buildWeek(dailyAvg: number, seed: number, now: number): Bar[] {
  return Array.from({ length: 7 }, (_, i) => {
    const offset = 6 - i;
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    d.setHours(12, 0, 0, 0);
    const dow = d.getDay();
    const w = DAY_WEIGHTS[dow];
    const noise = noiseAt(seed, i + 50, 0.22);
    const value = Math.max(0, Math.round(dailyAvg * w * (1 + noise)));
    return { value, fullLabel: FULL_FMT.format(d) };
  });
}

function buildMonth(dailyAvg: number, seed: number, now: number): Bar[] {
  return Array.from({ length: 30 }, (_, i) => {
    const offset = 29 - i;
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    d.setHours(12, 0, 0, 0);
    const dow = d.getDay();
    const weeklyW = DAY_WEIGHTS[dow];
    const drift = noiseAt(seed, i + 100, 0.32);
    const value = Math.max(0, Math.round(dailyAvg * weeklyW * (1 + drift)));
    return { value, fullLabel: FULL_FMT.format(d) };
  });
}

function buildLifetime(
  dailyAvg: number,
  seed: number,
  now: number,
  openedAt: number,
): Bar[] {
  const totalDays = Math.max(1, Math.floor((now - openedAt) / DAY_MS));

  // Short petitions: one bar per day. Long ones: one bar per week so bars
  // don't end up 1px wide in the narrow panel.
  if (totalDays <= LIFETIME_WEEKLY_THRESHOLD) {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(openedAt);
      d.setDate(d.getDate() + i);
      d.setHours(12, 0, 0, 0);
      const dow = d.getDay();
      const weeklyW = DAY_WEIGHTS[dow];
      const drift = noiseAt(seed, i + 200, 0.32);
      const value = Math.max(0, Math.round(dailyAvg * weeklyW * (1 + drift)));
      return { value, fullLabel: FULL_FMT.format(d) };
    });
  }

  const totalWeeks = Math.ceil(totalDays / 7);
  return Array.from({ length: totalWeeks }, (_, i) => {
    const d = new Date(openedAt);
    d.setDate(d.getDate() + i * 7);
    d.setHours(12, 0, 0, 0);
    const drift = noiseAt(seed, i + 200, 0.25);
    const value = Math.max(0, Math.round(dailyAvg * 7 * (1 + drift)));
    return {
      value,
      fullLabel: `Week of ${SHORT_FMT.format(d)}`,
    };
  });
}

function axisLabels(
  range: Range,
  now: number,
  openedAt: number,
): string[] {
  if (range === "day") {
    return ["12am", "6am", "noon", "6pm", "11pm"];
  }
  if (range === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return DAY_NAMES_SHORT[d.getDay()];
    });
  }
  if (range === "month") {
    return [29, 22, 15, 7, 0].map((offset) => {
      const d = new Date(now);
      d.setDate(d.getDate() - offset);
      return SHORT_FMT.format(d);
    });
  }
  // lifetime — five evenly spaced dates from opened to now
  const totalMs = now - openedAt;
  return [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const d = new Date(openedAt + totalMs * t);
    return SHORT_FMT.format(d);
  });
}

function totalCaptionOf(range: Range): string {
  if (range === "day") return "today";
  if (range === "week") return "this week";
  if (range === "month") return "in the last 30 days";
  return "since the petition opened";
}

export function ActivityTrends({ attrs }: Props) {
  const [range, setRange] = useState<Range>("day");
  const [now, setNow] = useState<number>(() => Date.now());
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const opened = attrs.opened_at ? new Date(attrs.opened_at).getTime() : null;
  if (!opened) return null;

  const daysOpen = Math.max(1, (now - opened) / DAY_MS);
  const dailyAvg = Math.max(1, Math.round(attrs.signature_count / daysOpen));
  const seed = hashString(attrs.created_at);

  const bars =
    range === "day"
      ? buildDay(dailyAvg, seed, now)
      : range === "week"
        ? buildWeek(dailyAvg, seed, now)
        : range === "month"
          ? buildMonth(dailyAvg, seed, now)
          : buildLifetime(dailyAvg, seed, now, opened);

  const max = Math.max(...bars.map((b) => b.value), 1);
  const total = bars.reduce((s, b) => s + b.value, 0);

  let peakIdx = 0;
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].value > bars[peakIdx].value) peakIdx = i;
  }

  const focusedIdx = hoverIdx !== null ? hoverIdx : peakIdx;
  const focused = bars[focusedIdx];
  const focusedIsPeak = focusedIdx === peakIdx;

  return (
    <section className={cn(sectionShell, "gap-4")}>
      <div className="flex items-center justify-between gap-2">
        <SectionHeading>Trends</SectionHeading>
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
            {signatureFormatter.format(focused.value)}
          </span>
          <span className="text-xs text-muted-foreground md:text-sm">
            signatures
          </span>
        </div>
        <p className="text-xs leading-snug text-muted-foreground md:text-sm">
          {hoverIdx !== null
            ? focused.fullLabel
            : `Peak — ${focused.fullLabel}`}
          {hoverIdx === null && (
            <span className="text-muted-foreground/70">
              {" · "}
              {signatureFormatter.format(total)} {totalCaptionOf(range)}
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
            const isPeak = i === peakIdx;
            const isHovered = hoverIdx === i;
            const opacity = isHovered ? 1 : isPeak ? 0.7 : 0.35;
            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoverIdx(i)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                aria-label={`${b.fullLabel}: ${signatureFormatter.format(b.value)} signatures`}
                className="flex-1 cursor-pointer transition-[opacity,height] duration-200"
                style={{
                  height: `${Math.max(6, (b.value / max) * 100)}%`,
                  backgroundColor: "var(--color-primary)",
                  opacity,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground/70 md:text-xs">
          {axisLabels(range, now, opened).map((l, i) => (
            <span key={`${l}-${i}`}>{l}</span>
          ))}
        </div>
      </div>

      <p className="text-[11px] leading-snug text-muted-foreground/70 md:text-xs">
        {focusedIsPeak ? "Hover the bars to see other dates." : null}
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
      className="inline-flex items-center gap-1.5 rounded-sm border border-border/70 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground md:text-[10px]"
      title="Per-signature timestamps aren't in the public petitions API. This chart uses deterministic placeholder data to preview the design."
    >
      <span aria-hidden className="size-1 rounded-full bg-muted-foreground/60" />
      Preview
    </span>
  );
}
