"use client";

import type { PetitionAttributes } from "@/lib/petitions-api";

interface GeographyProps {
  attrs: PetitionAttributes;
}

const numberFormatter = new Intl.NumberFormat("en-GB");

const UK_CODE = "GB";
const TOTAL_UK_CONSTITUENCIES = 650;
const TOP_N = 5;

export function Geography({ attrs }: GeographyProps) {
  const constituencies = attrs.signatures_by_constituency;
  const countries = attrs.signatures_by_country;

  if (constituencies.length === 0) {
    return (
      <div className="flex h-full flex-col gap-4 lg:gap-5">
        <Heading />
        <p className="text-base text-muted-foreground md:text-lg lg:text-xl">
          No constituency data yet.
        </p>
      </div>
    );
  }

  const signed = constituencies.filter((c) => c.signature_count > 0).length;
  const total = Math.max(constituencies.length, TOTAL_UK_CONSTITUENCIES);

  const topAreas = [...constituencies]
    .sort((a, b) => b.signature_count - a.signature_count)
    .slice(0, TOP_N);

  const topCount = topAreas[0]?.signature_count || 1;

  const ukCount =
    countries.find((c) => c.code === UK_CODE)?.signature_count ?? 0;
  const countriesTotal = countries.reduce(
    (sum, c) => sum + c.signature_count,
    0,
  );
  const internationalCount = Math.max(0, countriesTotal - ukCount);

  return (
    <div className="flex h-full flex-col gap-5 lg:gap-6">
      <Heading />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-5xl font-bold leading-none tabular-nums md:text-6xl lg:text-6xl xl:text-7xl">
            {numberFormatter.format(signed)}
          </span>
          <span className="font-mono text-2xl tabular-nums text-muted-foreground md:text-3xl lg:text-3xl xl:text-4xl">
            / {total}
          </span>
        </div>
        <p className="text-xs text-muted-foreground md:text-sm lg:text-base xl:text-lg">
          constituencies have signed
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2 lg:gap-3">
        <h3 className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base">
          Top areas
        </h3>
        <ul className="flex flex-col gap-2 lg:gap-2.5">
          {topAreas.map((item) => {
            const widthPct = Math.max(
              4,
              (item.signature_count / topCount) * 100,
            );
            return (
              <li
                key={item.ons_code}
                className="relative overflow-hidden rounded-md border border-border/40"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-foreground/[0.06]"
                  style={{ width: `${widthPct}%` }}
                />
                <div className="relative flex items-baseline justify-between gap-3 px-3 py-2 lg:px-4 lg:py-2.5">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium md:text-base lg:text-lg">
                      {item.name}
                    </span>
                    {item.mp && (
                      <span className="truncate text-xs text-muted-foreground md:text-sm lg:text-base">
                        {item.mp}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums md:text-base lg:text-lg">
                    {numberFormatter.format(item.signature_count)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {internationalCount > 0 && (
        <p className="border-t border-border/50 pt-3 text-xs text-muted-foreground md:text-sm lg:text-base lg:pt-4">
          {numberFormatter.format(internationalCount)} signed from outside the UK
        </p>
      )}
    </div>
  );
}

function Heading() {
  return (
    <h2 className="text-lg font-semibold md:text-xl lg:text-2xl xl:text-3xl">
      Geography
    </h2>
  );
}
