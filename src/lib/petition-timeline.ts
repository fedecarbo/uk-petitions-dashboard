import raw from "@/data/petition-751472-hourly.json";

// Real captured signatures-over-time for a single example petition. The chart
// sections render this regardless of which petition the user has loaded
// (signalled by the Preview badge), same role as the synthesised mock that
// preceded it. If the upstream API ever exposes an /hourly endpoint, this
// file is the seam where we'd swap a fetch in.
export const PETITION_TIMELINE_META = {
  petition_id: 751472,
  action:
    "Introduce a screening programme for prostate cancer, starting with high-risk men",
  opened_at: Date.parse("2026-01-13T11:30:15Z"),
  closed_at: null as number | null,
  // Last timestamp present in the capture; rows after this are treated as
  // "not captured yet" rather than "happened to be zero."
  captured_at: Date.parse("2026-05-19T11:00:00Z"),
};

type RawRow = Record<string, number>;
interface RawTimeline {
  hourly: RawRow[];
}

// Keyed by the hour's start-of-hour timestamp (ms). Built lazily so we don't
// pay the cost during module-init on every server render.
let counts: Map<number, number> | null = null;

function init(): Map<number, number> {
  if (counts) return counts;
  const map = new Map<number, number>();
  const { opened_at, captured_at } = PETITION_TIMELINE_META;
  for (const row of (raw as RawTimeline).hourly) {
    const entries = Object.entries(row);
    if (entries.length === 0) continue;
    const [t, c] = entries[0];
    const ts = Date.parse(t);
    if (Number.isNaN(ts)) continue;
    // Drop stray rows outside the petition's open window (e.g. the lone
    // 2025-11-22 pre-launch entry).
    if (ts < opened_at || ts > captured_at) continue;
    map.set(ts, c);
  }
  counts = map;
  return map;
}

export function countAtHour(hourStartMs: number): number {
  return init().get(hourStartMs) ?? 0;
}

export function sumInRange(fromMs: number, toMs: number): number {
  const map = init();
  const { opened_at, captured_at } = PETITION_TIMELINE_META;
  const lo = Math.max(fromMs, opened_at);
  const hi = Math.min(toMs, captured_at + 60 * 60 * 1000);
  let total = 0;
  for (const [t, c] of map) {
    if (t >= lo && t < hi) total += c;
  }
  return total;
}
