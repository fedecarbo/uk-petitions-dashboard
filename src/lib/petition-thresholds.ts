import type { PetitionAttributes } from "@/lib/petitions-api";

export const RESPONSE_THRESHOLD = 10_000;
export const DEBATE_THRESHOLD = 100_000;

export interface NextTarget {
  count: number;
  caption: string;
}

export function isPetitionClosed(attrs: PetitionAttributes): boolean {
  return (
    attrs.state === "closed" ||
    attrs.state === "rejected" ||
    (attrs.closed_at !== null &&
      new Date(attrs.closed_at).getTime() <= Date.now())
  );
}

export function nextTarget(attrs: PetitionAttributes): NextTarget | null {
  if (isPetitionClosed(attrs)) return null;
  if (!attrs.response_threshold_reached_at) {
    return {
      count: RESPONSE_THRESHOLD,
      caption: "for a government response",
    };
  }
  if (!attrs.debate_threshold_reached_at) {
    return {
      count: DEBATE_THRESHOLD,
      caption: "to be considered for debate",
    };
  }
  return null;
}

// Linear position on the 0 → DEBATE_THRESHOLD track, capped at 1.
// The 10k response threshold sits at 10% of the bar; the right edge is 100k.
export function journeyProgress(count: number): number {
  if (count <= 0) return 0;
  return Math.min(1, count / DEBATE_THRESHOLD);
}
