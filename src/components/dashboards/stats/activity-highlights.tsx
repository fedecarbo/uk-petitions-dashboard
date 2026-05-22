"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PetitionAttributes } from "@/lib/petitions-api";
import { signatureFormatter } from "@/lib/format";
import { peakDay, peakMonth } from "@/lib/petition-timeline";
import { SectionHeading, sectionShell } from "./section-heading";
import { cn } from "@/lib/utils";

const DAY_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "long" });

function fmt(n: number): string {
  return signatureFormatter.format(n);
}

interface Stat {
  label: string;
  // The headline answer — a place or a date, not the count.
  hero: string;
  count: number;
  // Optional call-to-action link beneath the hero.
  cta?: { href: string; label: string };
}

// The strongest-supporting constituency from the loaded petition (real data).
// Null when the petition has no per-constituency breakdown yet.
function topConstituency(attrs: PetitionAttributes) {
  let best: PetitionAttributes["signatures_by_constituency"][number] | null =
    null;
  for (const c of attrs.signatures_by_constituency) {
    if (c.signature_count <= 0) continue;
    if (!best || c.signature_count > best.signature_count) best = c;
  }
  return best;
}

export function Highlights({ attrs }: { attrs: PetitionAttributes }) {
  const pathname = usePathname();
  const constituency = topConstituency(attrs);
  const day = peakDay();
  const month = peakMonth();

  const stats: Stat[] = [];

  if (constituency) {
    stats.push({
      label: "Strongest constituency",
      hero: constituency.name,
      count: constituency.signature_count,
      cta: { href: `${pathname}?view=map`, label: "See the full map" },
    });
  }
  if (day) {
    stats.push({
      label: "Busiest day",
      hero: DAY_FMT.format(day.ts),
      count: day.total,
    });
  }
  if (month) {
    stats.push({
      label: "Busiest month",
      hero: MONTH_FMT.format(month.ts),
      count: month.total,
    });
  }

  if (stats.length === 0) return null;

  return (
    <section className={cn(sectionShell, "gap-4")}>
      <div className="mb-1">
        <SectionHeading>Highlights</SectionHeading>
      </div>

      <div className="flex flex-col">
        <div className="flex flex-col gap-2">
          {stats.map((s) => (
            <StatRow key={s.label} {...s} />
          ))}
        </div>

        {(day || month) && (
          <p className="mt-3 text-base leading-snug text-muted-foreground/70">
            Busiest day and month use sample timing data.
          </p>
        )}
      </div>
    </section>
  );
}

function StatRow({ label, hero, count, cta }: Stat) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border px-4 py-3">
      <div className="flex items-baseline justify-between gap-3 text-base text-muted-foreground">
        <span>{label}</span>
        <span className="shrink-0 whitespace-nowrap">
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {fmt(count)}
          </span>{" "}
          signatures
        </span>
      </div>
      <span className="text-2xl font-bold leading-tight tracking-tight text-balance">
        {hero}
      </span>
      {cta && (
        <Link
          href={cta.href}
          className="mt-1.5 self-start text-base font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
