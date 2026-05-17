"use client";

import type { PetitionAttributes } from "@/lib/petitions-api";

interface TopConstituenciesProps {
  items: PetitionAttributes["signatures_by_constituency"];
}

const numberFormatter = new Intl.NumberFormat("en-GB");
const TOP_N = 5;

export function TopConstituencies({ items }: TopConstituenciesProps) {
  const ranked = [...items]
    .sort((a, b) => b.signature_count - a.signature_count)
    .slice(0, TOP_N);

  if (ranked.length === 0) {
    return (
      <div className="flex h-full flex-col gap-4 lg:gap-5">
        <Heading />
        <p className="text-base text-muted-foreground md:text-lg lg:text-xl">
          No constituency data yet.
        </p>
      </div>
    );
  }

  const topCount = ranked[0].signature_count || 1;

  return (
    <div className="flex h-full flex-col gap-4 lg:gap-5">
      <Heading />
      <ol className="flex flex-col gap-3 lg:gap-4">
        {ranked.map((item, idx) => {
          const widthPct = Math.max(
            4,
            (item.signature_count / topCount) * 100,
          );
          return (
            <li
              key={item.ons_code}
              className="relative overflow-hidden rounded-md border border-border/60 bg-card"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-foreground/[0.06]"
                style={{ width: `${widthPct}%` }}
              />
              <div className="relative flex items-center gap-3 px-3 py-3 lg:gap-4 lg:px-4 lg:py-4">
                <span className="font-mono text-sm tabular-nums text-muted-foreground lg:text-base xl:text-lg">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base font-semibold leading-tight md:text-lg lg:text-xl xl:text-2xl">
                    {item.name}
                  </span>
                  {item.mp && (
                    <span className="truncate text-sm text-muted-foreground lg:text-base xl:text-lg">
                      {item.mp}
                    </span>
                  )}
                </div>
                <span className="shrink-0 font-mono text-base font-semibold tabular-nums md:text-lg lg:text-xl xl:text-2xl">
                  {numberFormatter.format(item.signature_count)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Heading() {
  return (
    <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground md:text-sm lg:text-base xl:text-lg">
      Top constituencies
    </h2>
  );
}
