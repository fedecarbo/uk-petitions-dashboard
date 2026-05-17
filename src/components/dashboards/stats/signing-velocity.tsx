"use client";

import type { PetitionHistorySample } from "@/hooks/use-petition";
import { velocityPerHour, windowSpanMinutes } from "@/lib/velocity";

interface SigningVelocityProps {
  history: PetitionHistorySample[];
}

const numberFormatter = new Intl.NumberFormat("en-GB");
const rateFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

function computeTodayTotal(history: PetitionHistorySample[]): number {
  if (history.length < 2) return 0;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const cutoff = startOfToday.getTime();
  const todays = history.filter((s) => s.t >= cutoff);
  if (todays.length < 2) return 0;
  return Math.max(0, todays[todays.length - 1].count - todays[0].count);
}

interface SparklineProps {
  history: PetitionHistorySample[];
}

function Sparkline({ history }: SparklineProps) {
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

export function SigningVelocity({ history }: SigningVelocityProps) {
  const rate = velocityPerHour(history);
  const todayTotal = computeTodayTotal(history);
  const sampleCount = history.length;
  const windowMinutes = windowSpanMinutes(history);

  return (
    <div className="flex h-full flex-col gap-4 lg:gap-5">
      <h2 className="text-lg font-semibold md:text-xl lg:text-2xl xl:text-3xl">
        Signing velocity
      </h2>

      {rate === null ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-2">
          <p className="font-mono text-xl tabular-nums text-muted-foreground md:text-2xl lg:text-3xl">
            Calculating…
          </p>
          <p className="max-w-sm text-sm leading-snug text-muted-foreground/80 md:text-base lg:text-lg">
            Velocity becomes available once the dashboard has observed at least
            two polling intervals (~1 minute).
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 lg:gap-5">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold leading-none tabular-nums md:text-5xl lg:text-6xl xl:text-7xl">
                {rateFormatter.format(Math.max(0, rate))}
              </span>
              <span className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base xl:text-lg">
                / hour
              </span>
            </div>
            <span className="mt-1.5 text-sm text-muted-foreground md:text-base lg:text-lg">
              Based on the last {Math.max(1, windowMinutes)} min ({sampleCount} polls)
            </span>
          </div>

          <div className="text-foreground/80">
            <Sparkline history={history} />
          </div>

          <dl className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3 lg:gap-4 lg:pt-4">
            <div className="flex flex-col">
              <dt className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base">
                Today
              </dt>
              <dd className="font-mono text-xl font-semibold tabular-nums md:text-2xl lg:text-3xl">
                {numberFormatter.format(todayTotal)}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base">
                Window
              </dt>
              <dd className="font-mono text-xl font-semibold tabular-nums md:text-2xl lg:text-3xl">
                {Math.max(1, windowMinutes)}m
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
