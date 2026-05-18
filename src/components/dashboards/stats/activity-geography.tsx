"use client";

import type { PetitionAttributes } from "@/lib/petitions-api";
import { signatureFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionHeading, sectionShell } from "./section-heading";

interface Props {
  attrs: PetitionAttributes;
}

const TOP_N = 6;

function isUk(name: string, code: string): boolean {
  if (code === "GB") return true;
  const n = name.toLowerCase();
  return n.includes("united kingdom") || n === "great britain";
}

export function ActivityGeography({ attrs }: Props) {
  const regions = [...attrs.signatures_by_region]
    .sort((a, b) => b.signature_count - a.signature_count)
    .slice(0, TOP_N);

  const ukTotal = attrs.signatures_by_region.reduce(
    (sum, r) => sum + r.signature_count,
    0,
  );

  const ukEntry = attrs.signatures_by_country.find((c) =>
    isUk(c.name, c.code),
  );
  const nonUk = attrs.signatures_by_country
    .filter((c) => !isUk(c.name, c.code))
    .sort((a, b) => b.signature_count - a.signature_count);
  const nonUkTotal = nonUk.reduce((sum, c) => sum + c.signature_count, 0);
  const overallTotal =
    (ukEntry?.signature_count ?? ukTotal) + nonUkTotal || attrs.signature_count;
  const nonUkShare = overallTotal > 0 ? (nonUkTotal / overallTotal) * 100 : 0;

  const maxRegion = regions[0]?.signature_count ?? 0;

  if (regions.length === 0) return null;

  return (
    <section className={cn(sectionShell, "gap-4")}>
      <SectionHeading>Geography</SectionHeading>

      <ol className="flex flex-col gap-2">
        {regions.map((r, i) => {
          const share = ukTotal > 0 ? (r.signature_count / ukTotal) * 100 : 0;
          const barWidth =
            maxRegion > 0 ? (r.signature_count / maxRegion) * 100 : 0;
          const isLead = i === 0;
          return (
            <li key={r.ons_code} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-xs md:text-sm">
                <span
                  className={cn(
                    "flex items-baseline gap-2",
                    isLead ? "text-foreground" : "text-foreground/90",
                  )}
                >
                  <span
                    aria-hidden
                    className="w-3 font-mono text-[10px] tabular-nums text-muted-foreground/60 md:text-xs"
                  >
                    {i + 1}
                  </span>
                  <span className={isLead ? "font-medium" : ""}>{r.name}</span>
                </span>
                <div className="flex items-baseline gap-2 font-mono tabular-nums">
                  <span className="text-muted-foreground">
                    {signatureFormatter.format(r.signature_count)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 md:text-xs">
                    {share.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-1 w-full overflow-hidden bg-primary/10">
                <div
                  className={cn(
                    "h-full transition-[width] duration-500",
                    isLead ? "bg-primary" : "bg-primary/40",
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>

      {nonUkTotal > 0 && (
        <p className="text-xs leading-snug text-muted-foreground md:text-sm">
          Plus{" "}
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {signatureFormatter.format(nonUkTotal)}
          </span>{" "}
          signatures from outside the UK ({nonUkShare.toFixed(1)}%)
          {nonUk.length >= 2
            ? ` — most from ${nonUk[0].name} and ${nonUk[1].name}.`
            : nonUk.length === 1
              ? ` — most from ${nonUk[0].name}.`
              : "."}
        </p>
      )}
    </section>
  );
}
