import type { PetitionHistorySample } from "@/hooks/use-petition";

const WINDOW_MS = 15 * 60_000;

/** Returns signatures per millisecond, or null if not enough history. */
export function computeVelocityPerMs(
  history: PetitionHistorySample[],
): number | null {
  if (history.length < 2) return null;
  const newest = history[history.length - 1];
  const cutoff = newest.t - WINDOW_MS;
  const windowed = history.filter((s) => s.t >= cutoff);
  const samples = windowed.length >= 2 ? windowed : history;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const spanMs = last.t - first.t;
  if (spanMs <= 0) return null;
  const delta = last.count - first.count;
  return delta / spanMs;
}

export function velocityPerHour(
  history: PetitionHistorySample[],
): number | null {
  const perMs = computeVelocityPerMs(history);
  return perMs === null ? null : perMs * 3_600_000;
}

export function windowSpanMinutes(
  history: PetitionHistorySample[],
): number {
  if (history.length < 2) return 0;
  const newest = history[history.length - 1];
  const oldest = history[0];
  return Math.max(0, Math.round((newest.t - oldest.t) / 60_000));
}
