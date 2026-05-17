"use client";

import type { PetitionHistorySample } from "@/hooks/use-petition";
import { velocityPerHour } from "@/lib/velocity";

interface ActivityProps {
  history: PetitionHistorySample[];
}

const numberFormatter = new Intl.NumberFormat("en-GB");
const rateFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

type Trend = "accelerating" | "steady" | "slowing";

const TREND_LABEL: Record<Trend, { glyph: string; word: string }> = {
  accelerating: { glyph: "↑", word: "accelerating" },
  steady: { glyph: "→", word: "steady" },
  slowing: { glyph: "↓", word: "slowing" },
};

function computeTodayTotal(history: PetitionHistorySample[]): number {
  if (history.length < 2) return 0;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const cutoff = startOfToday.getTime();
  const todays = history.filter((s) => s.t >= cutoff);
  if (todays.length < 2) return 0;
  return Math.max(0, todays[todays.length - 1].count - todays[0].count);
}

function ratePerMs(samples: PetitionHistorySample[]): number | null {
  if (samples.length < 2) return null;
  const span = samples[samples.length - 1].t - samples[0].t;
  if (span <= 0) return null;
  return (samples[samples.length - 1].count - samples[0].count) / span;
}

function computeTrend(history: PetitionHistorySample[]): Trend | null {
  if (history.length < 4) return null;
  const first = history[0].t;
  const last = history[history.length - 1].t;
  const midT = first + (last - first) / 2;
  const before = history.filter((s) => s.t <= midT);
  const after = history.filter((s) => s.t >= midT);
  const r1 = ratePerMs(before);
  const r2 = ratePerMs(after);
  if (r1 === null || r2 === null) return null;
  if (r1 <= 0) return r2 > 0 ? "accelerating" : "steady";
  const ratio = r2 / r1;
  if (ratio >= 1.1) return "accelerating";
  if (ratio <= 0.9) return "slowing";
  return "steady";
}

function Sparkline({ history }: { history: PetitionHistorySample[] }) {
  if (history.length < 2) return null;
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
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-12 w-full lg:h-16"
      role="img"
      aria-label="Signature trend over recent polls"
    >
      <path d={areaPath} fill="currentColor" fillOpacity={0.1} />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Activity({ history }: ActivityProps) {
  const rate = velocityPerHour(history);
  const todayTotal = computeTodayTotal(history);
  const trend = computeTrend(history);
  const cadenceSeconds =
    rate !== null && rate > 0 ? Math.max(1, Math.round(3600 / rate)) : null;

  return (
    <div className="flex h-full flex-col gap-4 lg:gap-5">
      <h2 className="text-lg font-semibold md:text-xl lg:text-2xl xl:text-3xl">
        Activity
      </h2>

      {rate === null ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-2">
          <p className="font-mono text-xl tabular-nums text-muted-foreground md:text-2xl lg:text-3xl">
            Calculating…
          </p>
          <p className="max-w-sm text-sm leading-snug text-muted-foreground/80 md:text-base lg:text-lg">
            Activity becomes available once the dashboard has observed at least
            two polling intervals (~1 minute).
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 lg:gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold leading-none tabular-nums md:text-5xl lg:text-6xl xl:text-7xl">
                {rateFormatter.format(Math.max(0, rate))}
              </span>
              <span className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base xl:text-lg">
                / hour
              </span>
            </div>
            {cadenceSeconds !== null && (
              <p className="text-sm text-muted-foreground md:text-base lg:text-lg">
                {cadenceSeconds === 1
                  ? "≈ one signature every second"
                  : `≈ one signature every ${cadenceSeconds} seconds`}
              </p>
            )}
          </div>

          <div className="text-foreground/80">
            <Sparkline history={history} />
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border/50 pt-3 text-sm md:text-base lg:pt-4 lg:text-lg">
            <span className="text-muted-foreground">Today</span>
            <span className="font-mono font-semibold tabular-nums">
              {numberFormatter.format(todayTotal)}
            </span>
            {trend && (
              <>
                <span aria-hidden className="text-muted-foreground/50">
                  ·
                </span>
                <span className="text-muted-foreground">
                  <span aria-hidden className="pr-1 font-mono">
                    {TREND_LABEL[trend].glyph}
                  </span>
                  {TREND_LABEL[trend].word}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
