import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type {
  GeometryCollection as TopoGeometryCollection,
  Topology,
} from "topojson-specification";
import { signatureFormatter } from "@/lib/format";

export interface ConstituencyProps {
  PCON24CD: string;
  PCON24NM: string;
}

export type ConstituencyFeature = Feature<Geometry, ConstituencyProps>;
export type ConstituencyCollection = FeatureCollection<Geometry, ConstituencyProps>;

function loadTopo(url: string): Promise<ConstituencyCollection> {
  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load constituency boundaries (${r.status})`);
      return r.json() as Promise<Topology>;
    })
    .then((topo) => {
      const obj = topo.objects.constituencies as TopoGeometryCollection<ConstituencyProps>;
      return feature(topo, obj) as ConstituencyCollection;
    });
}

let baseCache: Promise<ConstituencyCollection> | null = null;
let detailedCache: Promise<ConstituencyCollection> | null = null;

export function loadConstituencies(): Promise<ConstituencyCollection> {
  if (!baseCache) baseCache = loadTopo("/uk-constituencies.topo.json");
  return baseCache;
}

// Higher-resolution boundaries (BGC, 20m simplification). Lazy-loaded on
// first zoom-in past the detail threshold so the initial map paint stays
// cheap. ~895 KB on the wire.
export function loadDetailedConstituencies(): Promise<ConstituencyCollection> {
  if (!detailedCache) {
    detailedCache = loadTopo("/uk-constituencies-detailed.topo.json");
  }
  return detailedCache;
}

export interface IntensityScale {
  // Returns 0 for unsigned, otherwise a number in [floor, 1] indicating how
  // saturated the choropleth fill should be for the given count.
  intensityFor: (count: number) => number;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

// Floor opacity so even the lowest signed constituency is visibly tinted
// against the muted map background.
const INTENSITY_FLOOR = 0.25;

// Continuous log-scaled intensity. Each constituency gets a unique opacity
// computed from its position on the log distribution between min and max
// positive values. Log scale handles the heavy right-skew of petition data —
// orders-of-magnitude differences map to perceptible visual differences
// instead of being lumped into a single discrete top bin. Returns 0 for
// non-positive values so the path renders as `fill-muted` (background colour).
export function buildIntensityScale(
  values: number[],
  formatLabel: (value: number) => string = (v) => signatureFormatter.format(v),
): IntensityScale {
  const positive = values.filter((n) => n > 0);

  if (positive.length === 0) {
    return {
      intensityFor: () => 0,
      min: 0,
      max: 0,
      minLabel: formatLabel(0),
      maxLabel: formatLabel(0),
    };
  }

  const min = Math.min(...positive);
  const max = Math.max(...positive);

  if (min === max) {
    return {
      intensityFor: (v) => (v <= 0 ? 0 : 1),
      min,
      max,
      minLabel: formatLabel(min),
      maxLabel: formatLabel(max),
    };
  }

  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const span = logMax - logMin;

  return {
    intensityFor: (v) => {
      if (v <= 0) return 0;
      if (v >= max) return 1;
      const t = (Math.log(v) - logMin) / span;
      return INTENSITY_FLOOR + (1 - INTENSITY_FLOOR) * Math.max(0, Math.min(1, t));
    },
    min,
    max,
    minLabel: formatLabel(min),
    maxLabel: formatLabel(max),
  };
}
