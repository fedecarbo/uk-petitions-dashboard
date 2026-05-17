"use client";

import Link from "next/link";
import { LiveIndicator } from "@/components/live-indicator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DashboardError,
  DashboardLoading,
} from "@/components/dashboards/states";
import { usePetition } from "@/hooks/use-petition";

interface DashboardCenteredProps {
  id: string;
}

const signatureFormatter = new Intl.NumberFormat("en-GB");

export function DashboardCentered({ id }: DashboardCenteredProps) {
  const { state, lastUpdated, isRefreshing } = usePetition(id);

  if (state.status === "loading") return <DashboardLoading id={id} />;
  if (state.status === "error")
    return <DashboardError id={id} message={state.message} />;

  const attrs = state.data.data.attributes;

  return (
    <main className="flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-6 border-b px-6 py-4 md:px-12 md:py-5 lg:px-20">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="shrink-0 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground md:text-sm lg:text-base xl:text-lg"
          >
            ← New search
          </Link>
          <h1 className="truncate text-base font-medium md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
            {attrs.action}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
          />
          <ThemeToggle />
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-6 py-12 md:py-20 lg:min-h-0 lg:overflow-hidden">
        <div className="flex flex-col items-center gap-3 md:gap-6">
          <span
            aria-label={`${signatureFormatter.format(attrs.signature_count)} signatures`}
            className="font-mono text-7xl font-bold leading-none tracking-tight tabular-nums sm:text-8xl lg:text-9xl xl:text-[10rem] 2xl:text-[14rem]"
          >
            {signatureFormatter.format(attrs.signature_count)}
          </span>
          <span className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground md:text-base lg:text-lg xl:text-xl 2xl:text-2xl">
            Signatures
          </span>
        </div>
      </section>
    </main>
  );
}
