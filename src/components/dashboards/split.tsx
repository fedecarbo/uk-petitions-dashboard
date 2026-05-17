"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LiveIndicator } from "@/components/live-indicator";
import { PetitionStatus } from "@/components/petition-status";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DashboardError,
  DashboardLoading,
} from "@/components/dashboards/states";
import { MapMode } from "@/components/dashboards/map-mode";
import { StatCarousel } from "@/components/dashboards/stat-carousel";
import {
  ViewToggle,
  type DashboardView,
} from "@/components/dashboards/view-toggle";
import { usePetition } from "@/hooks/use-petition";
import { signatureFormatter } from "@/lib/format";
import type { PetitionAttributes } from "@/lib/petitions-api";
import type { PetitionHistorySample } from "@/hooks/use-petition";
import {
  isPetitionClosed,
  journeyProgress,
  nextTarget,
} from "@/lib/petition-thresholds";
import { cn } from "@/lib/utils";

interface DashboardSplitProps {
  id: string;
  view: DashboardView;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return dateFormatter.format(d);
}

function PetitionByline({ attrs }: { attrs: PetitionAttributes }) {
  const isClosed = isPetitionClosed(attrs);
  const closed = formatDate(attrs.closed_at);
  const closing = formatDate(attrs.closing_date);

  const facts: string[] = [];
  if (attrs.creator_name) facts.push(`Created by ${attrs.creator_name}`);
  if (isClosed && closed) {
    facts.push(`Closed ${closed}`);
  } else if (!isClosed && closing) {
    facts.push(`Closes ${closing}`);
  }

  if (facts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground md:text-sm lg:gap-x-4 lg:text-base xl:text-lg">
      {facts.map((fact, i) => (
        <span key={fact} className="flex items-center gap-x-3 lg:gap-x-4">
          {i > 0 && (
            <span aria-hidden className="text-muted-foreground/50">
              ·
            </span>
          )}
          {fact}
        </span>
      ))}
    </div>
  );
}

function JourneyBar({ attrs }: { attrs: PetitionAttributes }) {
  if (attrs.signature_count <= 0) return null;

  const target = nextTarget(attrs);
  const progress = journeyProgress(attrs.signature_count);
  const responseReached = attrs.response_threshold_reached_at !== null;
  const debateReached = attrs.debate_threshold_reached_at !== null;
  const isClosed = isPetitionClosed(attrs);

  const sentence = target
    ? `${signatureFormatter.format(target.count - attrs.signature_count)} ${target.caption}`
    : null;

  return (
    <div className="flex flex-col gap-2 pt-2 md:gap-2.5 md:pt-3 lg:gap-3 lg:pt-4">
      {sentence && (
        <p className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base xl:text-lg 2xl:text-xl">
          {sentence}
        </p>
      )}
      <div className="relative py-1.5">
        <div
          className="h-2 w-full overflow-hidden bg-primary/10 md:h-2.5 lg:h-3 2xl:h-4"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Parliamentary thresholds progress"
        >
          <div
            className={cn(
              "h-full transition-[width] duration-500",
              isClosed ? "bg-muted-foreground/50" : "bg-primary",
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <JourneyTick position={0.1} reached={responseReached} />
      </div>
      <div className="relative h-3 md:h-4 lg:h-5 2xl:h-7">
        <JourneyLabel
          position={0.1}
          label="10,000"
          reached={responseReached}
          align="center"
        />
        <JourneyLabel
          position={1}
          label="100,000"
          reached={debateReached}
          align="right"
        />
      </div>
    </div>
  );
}

function JourneyTick({
  position,
  reached,
}: {
  position: number;
  reached: boolean;
}) {
  return (
    <span
      aria-hidden
      style={{ left: `${position * 100}%` }}
      className={cn(
        "pointer-events-none absolute inset-y-0 w-px -translate-x-1/2",
        reached ? "bg-primary" : "bg-muted-foreground/70",
      )}
    />
  );
}

function JourneyLabel({
  position,
  label,
  reached,
  align,
}: {
  position: number;
  label: string;
  reached: boolean;
  align: "center" | "right";
}) {
  return (
    <span
      style={{ left: `${position * 100}%` }}
      className={cn(
        "absolute top-0 text-[10px] font-medium tabular-nums md:text-xs lg:text-sm xl:text-base 2xl:text-lg",
        align === "right" ? "-translate-x-full" : "-translate-x-1/2",
        reached
          ? "text-foreground font-semibold"
          : "text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

function AdditionalDetails({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex max-w-3xl flex-col gap-2">
      {expanded && (
        <p className="whitespace-pre-line text-sm leading-snug text-muted-foreground md:text-base lg:text-base xl:text-lg 2xl:text-xl">
          {text}
        </p>
      )}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="self-start text-xs font-medium text-primary underline underline-offset-4 hover:no-underline md:text-sm lg:text-base"
        aria-expanded={expanded}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

function StatsBody({
  attrs,
  history,
}: {
  attrs: PetitionAttributes;
  history: PetitionHistorySample[];
}) {
  return (
    <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:overflow-hidden">
      <section className="flex min-w-0 flex-col border-b border-border lg:grid lg:grid-rows-[2fr_1fr] lg:border-b-0 lg:border-r lg:min-h-0 lg:overflow-hidden">
        <div className="no-scrollbar flex flex-col gap-3 border-b border-border p-6 md:gap-4 md:p-8 lg:min-h-0 lg:overflow-y-auto lg:p-8">
          <PetitionStatus state={attrs.state} />
          <h1 className="text-2xl font-semibold leading-[1.1] tracking-tight text-balance md:text-3xl lg:text-3xl xl:text-4xl 2xl:text-6xl">
            {attrs.action}
          </h1>
          <PetitionByline attrs={attrs} />

          {attrs.background && (
            <p className="max-w-3xl whitespace-pre-line text-base leading-snug text-muted-foreground md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl">
              {attrs.background}
            </p>
          )}

          {attrs.additional_details && (
            <AdditionalDetails text={attrs.additional_details} />
          )}
        </div>

        <div className="flex flex-col justify-center gap-2 p-6 md:gap-3 md:p-8 lg:min-h-0 lg:p-8">
          <div className="flex items-baseline gap-3 md:gap-4 lg:gap-5 2xl:gap-6">
            <span
              aria-label={`${signatureFormatter.format(attrs.signature_count)} signatures`}
              className="font-mono text-6xl font-bold leading-none tracking-tight tabular-nums sm:text-7xl lg:text-7xl xl:text-8xl 2xl:text-8xl"
            >
              {signatureFormatter.format(attrs.signature_count)}
            </span>
            <span className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base xl:text-lg 2xl:text-xl">
              Signatures
            </span>
          </div>
          <JourneyBar attrs={attrs} />
        </div>
      </section>

      <aside
        aria-label="Petition statistics"
        className="min-h-[320px] lg:min-h-0 lg:overflow-hidden"
      >
        <StatCarousel attrs={attrs} history={history} className="h-full" />
      </aside>
    </div>
  );
}

export function DashboardSplit({ id, view }: DashboardSplitProps) {
  const { state, lastUpdated, isRefreshing, history } = usePetition(id);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (state.status === "loading") return <DashboardLoading id={id} />;
  if (state.status === "error")
    return <DashboardError id={id} message={state.message} />;

  const attrs = state.data.data.attributes;

  function handleViewChange(next: DashboardView) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "stats") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <main className="flex min-h-dvh flex-col gap-3 p-6 md:gap-4 md:p-8 lg:h-dvh lg:gap-4 lg:overflow-hidden lg:p-10 xl:p-12">
      <header className="flex shrink-0 items-center justify-between gap-6">
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
        >
          ← New search
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="https://unboxed.co"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden text-xs text-muted-foreground hover:text-foreground md:inline md:text-sm"
          >
            Built by{" "}
            <span className="font-medium text-foreground">Unboxed</span>
          </a>
          <LiveIndicator
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
          />
          <ViewToggle value={view} onChange={handleViewChange} />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border lg:min-h-0">
        {view === "map" ? (
          <MapMode attrs={attrs} />
        ) : (
          <StatsBody attrs={attrs} history={history} />
        )}
      </div>
    </main>
  );
}
