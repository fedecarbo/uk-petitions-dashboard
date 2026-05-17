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

const LIVE_STATES = new Set<PetitionState>(["open", "awaiting_response", "awaiting_debate"]);

export function PetitionStatus({ state }: PetitionStatusProps) {
  const label = STATE_LABEL[state] ?? state;
  const isLive = LIVE_STATES.has(state);

  return (
    <span
      className={cn(
        "inline-flex items-center self-start rounded-sm px-2.5 py-1 text-xs font-medium lg:px-3 lg:py-1.5 lg:text-base xl:px-4 xl:py-2 xl:text-lg",
        isLive
          ? "bg-[#cce2d8] text-[#006548] dark:bg-card dark:text-[#9ce0c0]"
          : "bg-[#eeefef] text-[#383f43] dark:bg-card dark:text-foreground/85",
      )}
    >
      {label}
    </span>
  );
}
