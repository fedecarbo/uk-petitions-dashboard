"use client";

import { useState } from "react";
import Link from "next/link";
import { LiveIndicator } from "@/components/live-indicator";
import { PetitionStatus } from "@/components/petition-status";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DashboardError,
  DashboardLoading,
} from "@/components/dashboards/states";
import { StatCarousel } from "@/components/dashboards/stat-carousel";
import { usePetition } from "@/hooks/use-petition";

interface DashboardSplitProps {
  id: string;
}

const signatureFormatter = new Intl.NumberFormat("en-GB");

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
        className="self-start text-xs font-medium text-foreground underline underline-offset-4 hover:no-underline md:text-sm lg:text-base"
        aria-expanded={expanded}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

export function DashboardSplit({ id }: DashboardSplitProps) {
  const { state, lastUpdated, isRefreshing, history } = usePetition(id);

  if (state.status === "loading") return <DashboardLoading id={id} />;
  if (state.status === "error")
    return <DashboardError id={id} message={state.message} />;

  const attrs = state.data.data.attributes;

  return (
    <main className="flex min-h-dvh flex-col gap-4 p-6 md:gap-6 md:p-8 lg:h-dvh lg:gap-6 lg:overflow-hidden lg:p-10 xl:p-12">
      <header className="flex shrink-0 items-center justify-between gap-6">
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground md:text-sm lg:text-base xl:text-lg"
        >
          ← New search
        </Link>
        <div className="flex items-center gap-3">
          <LiveIndicator
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
          />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 flex-col border border-border lg:min-h-0 lg:overflow-hidden">
        <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:overflow-hidden">
          <section className="flex min-w-0 flex-col border-b border-border lg:grid lg:grid-rows-[2fr_1fr] lg:border-b-0 lg:border-r lg:min-h-0 lg:overflow-hidden">
            <div className="no-scrollbar flex flex-col gap-3 border-b border-border p-5 md:gap-4 md:p-6 lg:min-h-0 lg:overflow-y-auto lg:p-6">
              <PetitionStatus
                state={attrs.state}
                openedAt={attrs.opened_at}
                closedAt={attrs.closed_at}
              />
              <h1 className="text-2xl font-semibold leading-[1.1] tracking-tight text-balance md:text-3xl lg:text-3xl xl:text-4xl 2xl:text-6xl">
                {attrs.action}
              </h1>

              {attrs.background && (
                <p className="max-w-3xl whitespace-pre-line text-base leading-snug text-foreground/85 md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl">
                  {attrs.background}
                </p>
              )}

              {attrs.additional_details && (
                <AdditionalDetails text={attrs.additional_details} />
              )}
            </div>

            <div className="flex flex-col justify-center gap-2 p-5 md:gap-3 md:p-6 lg:min-h-0 lg:p-6">
              <span
                aria-label={`${signatureFormatter.format(attrs.signature_count)} signatures`}
                className="font-mono text-6xl font-bold leading-none tracking-tight tabular-nums sm:text-7xl lg:text-7xl xl:text-8xl 2xl:text-9xl"
              >
                {signatureFormatter.format(attrs.signature_count)}
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground md:text-sm lg:text-base xl:text-lg 2xl:text-xl">
                Signatures
              </span>
            </div>
          </section>

          <aside
            aria-label="Petition statistics"
            className="min-h-[320px] lg:min-h-0 lg:overflow-hidden"
          >
            <StatCarousel
              attrs={attrs}
              history={history}
              className="h-full"
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
