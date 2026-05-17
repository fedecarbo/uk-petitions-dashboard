import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type {
  GeometryCollection as TopoGeometryCollection,
  Topology,
} from "topojson-specification";

export interface ConstituencyProps {
  PCON24CD: string;
  PCON24NM: string;
}

export type ConstituencyFeature = Feature<Geometry, ConstituencyProps>;
export type ConstituencyCollection = FeatureCollection<Geometry, ConstituencyProps>;

let cache: Promise<ConstituencyCollection> | null = null;

export function loadConstituencies(): Promise<ConstituencyCollection> {
  if (!cache) {
    cache = fetch("/uk-constituencies.topo.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load constituency boundaries (${r.status})`);
        return r.json() as Promise<Topology>;
      })
      .then((topo) => {
        const obj = topo.objects.constituencies as TopoGeometryCollection<ConstituencyProps>;
        return feature(topo, obj) as ConstituencyCollection;
      });
  }
  return cache;
}

const BIN_THRESHOLDS = [1, 50, 250, 1000, 5000] as const;

export function binFor(count: number): number {
  if (count <= 0) return 0;
  for (let i = 0; i < BIN_THRESHOLDS.length; i++) {
    if (count < BIN_THRESHOLDS[i]) return i + 1;
  }
  return BIN_THRESHOLDS.length;
}

export const BIN_FILL_CLASS: Record<number, string> = {
  0: "fill-muted",
  1: "fill-primary/15",
  2: "fill-primary/30",
  3: "fill-primary/50",
  4: "fill-primary/75",
  5: "fill-primary",
};

export const BIN_LABELS: Array<{ label: string; bin: number }> = [
  { label: "0", bin: 0 },
  { label: "1–49", bin: 1 },
  { label: "50–249", bin: 2 },
  { label: "250–999", bin: 3 },
  { label: "1k–4.9k", bin: 4 },
  { label: "5k+", bin: 5 },
];
