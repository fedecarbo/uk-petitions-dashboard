"use client";

import type { PetitionAttributes } from "@/lib/petitions-api";
import type { PetitionHistorySample } from "@/hooks/use-petition";
import { velocityPerHour } from "@/lib/velocity";
import { isPetitionClosed } from "@/lib/petition-thresholds";
import { signatureFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionHeading, sectionShell } from "./section-heading";

interface Props {
  attrs: PetitionAttributes;
  history: PetitionHistorySample[];
}

const MIN_PULSE_MS = 1000;

export function ActivityPulse({ attrs, history }: Props) {
  const closed = isPetitionClosed(attrs);
  if (closed) return null;

  const rate = velocityPerHour(history);
  const cadenceSeconds =
    rate !== null && rate > 0 ? Math.max(1, Math.round(3600 / rate)) : null;
  // Cap visual pulse at 1 Hz so a high-traffic petition doesn't strobe.
  const pulseMs =
    cadenceSeconds !== null
      ? Math.max(MIN_PULSE_MS, cadenceSeconds * 1000)
      : null;
  const active = rate !== null && rate > 0;

  return (
    <section className={cn(sectionShell, "gap-4")}>
      <SectionHeading>Pulse</SectionHeading>

      <div className="flex items-center gap-5">
        <PulseRing pulseMs={pulseMs} active={active} />
        <div className="flex min-w-0 flex-col gap-1">
          {active && rate !== null ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold leading-none tabular-nums md:text-3xl">
                  {signatureFormatter.format(Math.round(rate))}
                </span>
                <span className="text-xs text-muted-foreground md:text-sm">
                  / hour
                </span>
              </div>
              {cadenceSeconds !== null && (
                <p className="text-[11px] leading-snug text-muted-foreground/80 md:text-xs">
                  {cadenceSeconds === 1
                    ? "Roughly one every second."
                    : `Roughly one every ${cadenceSeconds} seconds.`}
                </p>
              )}
            </>
          ) : (
            <span className="text-sm leading-snug text-muted-foreground md:text-base">
              {rate === null
                ? "Listening for the first signatures…"
                : "Signing has paused."}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function PulseRing({
  pulseMs,
  active,
}: {
  pulseMs: number | null;
  active: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-12 shrink-0 items-center justify-center rounded-full border md:size-14",
        active ? "border-live/30" : "border-muted-foreground/20",
      )}
    >
      {active && pulseMs !== null && (
        <>
          <span
            className="absolute inset-0 animate-ping rounded-full bg-live/30"
            style={{ animationDuration: `${pulseMs}ms` }}
          />
          <span
            className="absolute inset-2 animate-ping rounded-full bg-live/40"
            style={{
              animationDuration: `${pulseMs}ms`,
              animationDelay: `${pulseMs / 3}ms`,
            }}
          />
        </>
      )}
      <span
        className={cn(
          "relative inline-block size-3 rounded-full md:size-3.5",
          active ? "bg-live shadow-[0_0_8px_var(--color-live)]" : "bg-muted-foreground/40",
        )}
      />
    </span>
  );
}
