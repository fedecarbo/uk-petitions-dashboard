"use client";

import { PetitionStatus } from "@/components/petition-status";
import { ConstituencyBar } from "@/components/dashboards/constituency-bar";
import { UKConstituencyMap } from "@/components/dashboards/uk-constituency-map";
import { signatureFormatter } from "@/lib/format";
import type { PetitionAttributes } from "@/lib/petitions-api";

interface MapModeProps {
  attrs: PetitionAttributes;
}

const UK_COUNTRY_CODE = "GB";
const TOP_N = 10;

export function MapMode({ attrs }: MapModeProps) {
  const constituencies = attrs.signatures_by_constituency;
  const topAreas = [...constituencies]
    .sort((a, b) => b.signature_count - a.signature_count)
    .slice(0, TOP_N);
  const topCount = topAreas[0]?.signature_count || 1;

  const countriesTotal = attrs.signatures_by_country.reduce(
    (sum, c) => sum + c.signature_count,
    0,
  );
  const ukCount =
    attrs.signatures_by_country.find((c) => c.code === UK_COUNTRY_CODE)
      ?.signature_count ?? 0;
  const internationalCount = Math.max(0, countriesTotal - ukCount);

  return (
    <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:overflow-hidden">
      <section
        aria-label="Constituency map"
        className="relative min-h-[360px] min-w-0 border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r"
      >
        <UKConstituencyMap signaturesByConstituency={constituencies} />
      </section>

      <aside
        aria-label="Petition summary and top constituencies"
        className="flex min-w-0 flex-col gap-4 p-6 md:gap-5 md:p-8 lg:min-h-0 lg:overflow-y-auto lg:gap-5 lg:p-8"
      >
        <div className="flex flex-col gap-2 lg:gap-3">
          <PetitionStatus state={attrs.state} />
          <h1 className="text-lg font-semibold leading-tight tracking-tight text-balance md:text-xl lg:text-xl xl:text-2xl 2xl:text-3xl">
            {attrs.action}
          </h1>
        </div>

        <div className="flex items-baseline gap-2 lg:gap-3">
          <span
            aria-label={`${signatureFormatter.format(attrs.signature_count)} signatures`}
            className="font-mono text-3xl font-bold leading-none tracking-tight tabular-nums md:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl"
          >
            {signatureFormatter.format(attrs.signature_count)}
          </span>
          <span className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base">
            Signatures
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 border-t border-border/50 pt-4 lg:gap-3 lg:pt-5">
          <h2 className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base">
            Top constituencies
          </h2>
          {topAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground md:text-base">
              No constituency data yet.
            </p>
          ) : (
            <ol className="flex flex-col gap-2 lg:gap-2.5">
              {topAreas.map((item) => {
                const widthPct = Math.max(
                  4,
                  (item.signature_count / topCount) * 100,
                );
                return (
                  <ConstituencyBar
                    key={item.ons_code}
                    name={item.name}
                    mp={item.mp}
                    signatureCount={item.signature_count}
                    widthPct={widthPct}
                  />
                );
              })}
            </ol>
          )}
        </div>

        {internationalCount > 0 && (
          <p className="border-t border-border/50 pt-3 text-xs text-muted-foreground md:text-sm lg:pt-4 lg:text-base">
            {signatureFormatter.format(internationalCount)} signed from outside
            the UK
          </p>
        )}
      </aside>
    </div>
  );
}
