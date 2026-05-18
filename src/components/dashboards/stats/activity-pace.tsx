"use client";

import { useEffect, useState } from "react";
import type { PetitionAttributes } from "@/lib/petitions-api";
import type { PetitionHistorySample } from "@/hooks/use-petition";
import { velocityPerHour } from "@/lib/velocity";
import { isPetitionClosed } from "@/lib/petition-thresholds";
import { signatureFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionHeading, sectionShell } from "./section-heading";

interface Props {
  attrs: PetitionAttributes;
  history: PetitionHistorySample[];
}

const DAY_MS = 86_400_000;

function parseMs(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

type Trend = "accelerating" | "steady" | "slowing";

function trendOf(ratio: number | null): Trend | null {
  if (ratio === null) return null;
  if (ratio >= 1.15) return "accelerating";
  if (ratio <= 0.85) return "slowing";
  return "steady";
}

const TREND_GLYPH: Record<Trend, string> = {
  accelerating: "↗",
  steady: "→",
  slowing: "↘",
};

function compareWord(ratio: number): string {
  if (ratio >= 1.5) return "much faster than the lifetime average";
  if (ratio >= 1.2) return "noticeably faster than the lifetime average";
  if (ratio >= 0.85) return "in line with the lifetime average";
  if (ratio >= 0.5) return "noticeably slower than the lifetime average";
  return "much slower than the lifetime average";
}

export function ActivityPace({ attrs, history }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const opened = parseMs(attrs.opened_at);
  const closedAt = parseMs(attrs.closed_at);
  const closed = isPetitionClosed(attrs);

  if (!opened) return null;

  const endMs = closed && closedAt ? closedAt : now;
  const daysOpen = Math.max(1, (endMs - opened) / DAY_MS);
  const lifetimePerDay = Math.round(attrs.signature_count / daysOpen);

  const livePerHour = closed ? null : velocityPerHour(history);
  const livePerDay = livePerHour === null ? null : livePerHour * 24;
  const ratio =
    livePerDay !== null && lifetimePerDay > 0
      ? livePerDay / lifetimePerDay
      : null;
  const trend = trendOf(ratio);

  const era10k = (() => {
    const t = parseMs(attrs.response_threshold_reached_at);
    if (!t || t <= opened) return null;
    const daysToReach = Math.max(1, (t - opened) / DAY_MS);
    const before = Math.round(10_000 / daysToReach);
    const daysSince = Math.max(0.5, (endMs - t) / DAY_MS);
    const after = Math.round(
      Math.max(0, attrs.signature_count - 10_000) / daysSince,
    );
    return { before, after };
  })();

  const era100k = (() => {
    const t = parseMs(attrs.debate_threshold_reached_at);
    if (!t || t <= opened) return null;
    const daysSince = Math.max(0.5, (endMs - t) / DAY_MS);
    const after = Math.round(
      Math.max(0, attrs.signature_count - 100_000) / daysSince,
    );
    return { after };
  })();

  return (
    <section className={cn(sectionShell, "gap-5")}>
      <SectionHeading>Pace</SectionHeading>

      <PaceChart
        history={history}
        livePerHour={livePerHour}
        trend={trend}
        closed={closed}
      />

      {livePerHour !== null && livePerHour > 0 && ratio !== null && (
        <p className="text-xs leading-snug text-muted-foreground md:text-sm">
          {compareWord(ratio)}.
        </p>
      )}

      <dl className="flex flex-col gap-1.5 border-t border-border/60 pt-4 text-xs leading-snug text-muted-foreground md:text-sm">
        <Line
          label="Lifetime average"
          value={`${signatureFormatter.format(lifetimePerDay)} / day`}
          aside={`over ${Math.round(daysOpen).toLocaleString("en-GB")} days`}
        />
        {era10k && (
          <Line
            label="Before 10,000"
            value={`${signatureFormatter.format(era10k.before)} / day`}
            aside={`then ${signatureFormatter.format(era10k.after)} / day`}
          />
        )}
        {era100k && (
          <Line
            label="Since 100,000"
            value={`${signatureFormatter.format(era100k.after)} / day`}
          />
        )}
      </dl>
    </section>
  );
}

function PaceChart({
  history,
  livePerHour,
  trend,
  closed,
}: {
  history: PetitionHistorySample[];
  livePerHour: number | null;
  trend: Trend | null;
  closed: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          {livePerHour !== null && livePerHour > 0 ? (
            <>
              <span className="font-mono text-4xl font-bold leading-none tracking-tight tabular-nums md:text-5xl">
                {signatureFormatter.format(Math.round(livePerHour))}
              </span>
              <span className="text-xs font-medium text-muted-foreground md:text-sm">
                / hour
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground md:text-base">
              {closed
                ? "Signing has finished"
                : history.length < 2
                  ? "Gathering live rate…"
                  : "Signing has paused"}
            </span>
          )}
        </div>
        {trend && (
          <span className="font-mono text-xs text-muted-foreground md:text-sm">
            <span aria-hidden className="mr-1 text-base">
              {TREND_GLYPH[trend]}
            </span>
            {trend}
          </span>
        )}
      </div>
      <Sparkline history={history} />
    </div>
  );
}

function Sparkline({ history }: { history: PetitionHistorySample[] }) {
  if (history.length < 2) {
    return (
      <div className="flex h-20 w-full items-center justify-center bg-primary/[0.04] text-[10px] text-muted-foreground/60 md:h-24 md:text-xs">
        Waiting for the first poll…
      </div>
    );
  }

  const counts = history.map((s) => s.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const stepX = w / (history.length - 1);
  const points = history.map((s, i) => {
    const x = i * stepX;
    const y = h - ((s.count - min) / range) * h;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const path = `M${points.join(" L")}`;
  const areaPath = `${path} L${w.toFixed(2)},${h} L0,${h} Z`;
  const last = history[history.length - 1];
  const lastX = (history.length - 1) * stepX;
  const lastY = h - ((last.count - min) / range) * h;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-20 w-full text-primary md:h-24"
      role="img"
      aria-label="Signature trend over recent polls"
    >
      <defs>
        <linearGradient id="pace-spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#pace-spark-fill)" />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r={0.9}
        fill="currentColor"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Line({
  label,
  value,
  aside,
}: {
  label: string;
  value: string;
  aside?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-2 text-right">
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {aside && (
          <span className="text-[11px] text-muted-foreground/80 md:text-xs">
            {aside}
          </span>
        )}
      </span>
    </div>
  );
}
