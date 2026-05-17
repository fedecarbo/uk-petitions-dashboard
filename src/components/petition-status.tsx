import type { PetitionState } from "@/lib/petitions-api";
import { cn } from "@/lib/utils";

interface PetitionStatusProps {
  state: PetitionState;
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

export function PetitionStatus({ state }: PetitionStatusProps) {
  const label = STATE_LABEL[state] ?? state;
  const isLive = state === "open" || state === "awaiting_response" || state === "awaiting_debate";

  return (
    <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium lg:gap-2 lg:px-3 lg:py-1.5 lg:text-base xl:px-4 xl:py-2 xl:text-lg">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full lg:h-2 lg:w-2",
          isLive ? "bg-live" : "bg-muted-foreground",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
