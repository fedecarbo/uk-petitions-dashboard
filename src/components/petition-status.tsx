import type { PetitionState } from "@/lib/petitions-api";
import { cn } from "@/lib/utils";

interface PetitionStatusProps {
  state: PetitionState;
  openedAt: string | null;
  closedAt: string | null;
}

const STATE_LABEL: Record<PetitionState, string> = {
  open: "Open",
  closed: "Closed",
  rejected: "Rejected",
  awaiting_response: "Awaiting government response",
  with_response: "Government responded",
  awaiting_debate: "Awaiting debate",
  debated: "Debated",
  not_debated: "Not debated",
};

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

export function PetitionStatus({
  state,
  openedAt,
  closedAt,
}: PetitionStatusProps) {
  const label = STATE_LABEL[state] ?? state;
  const isLive = state === "open" || state === "awaiting_response" || state === "awaiting_debate";

  const opened = formatDate(openedAt);
  const closed = formatDate(closedAt);
  const dateLine = closed
    ? `Closed ${closed}`
    : opened
      ? `Opened ${opened}`
      : null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium uppercase tracking-[0.18em] md:text-sm lg:gap-x-4 lg:text-base xl:text-lg">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 lg:gap-2 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full lg:h-2 lg:w-2",
            isLive ? "bg-live" : "bg-muted-foreground",
          )}
          aria-hidden
        />
        {label}
      </span>
      {dateLine && (
        <span className="text-muted-foreground">{dateLine}</span>
      )}
    </div>
  );
}
