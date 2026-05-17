import { scaleQuantile } from "d3-scale";
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

export const BIN_FILL_CLASS: Record<number, string> = {
  0: "fill-muted",
  1: "fill-primary/15",
  2: "fill-primary/30",
  3: "fill-primary/50",
  4: "fill-primary/75",
  5: "fill-primary",
};

// HTML equivalent for swatches in the legend etc. — `fill-*` is an SVG-only
// CSS property, so spans need `bg-*` to render the same colour.
export const BIN_BG_CLASS: Record<number, string> = {
  0: "bg-muted",
  1: "bg-primary/15",
  2: "bg-primary/30",
  3: "bg-primary/50",
  4: "bg-primary/75",
  5: "bg-primary",
};

export interface BinLabel {
  label: string;
  bin: number;
}

export interface BinScale {
  binFor: (count: number) => number;
  labels: BinLabel[];
}

// Adaptive (quantile) bins. With fixed thresholds the choropleth washes out
// for small petitions and saturates for viral ones; quantile bins partition
// the actual distribution into 5 equal-size groups so the map always shows
// meaningful variation. Bin 0 is reserved for unsigned constituencies.
export function buildBinScale(
  signatures: Array<{ signature_count: number }>,
): BinScale {
  const signed = signatures
    .map((s) => s.signature_count)
    .filter((n) => n > 0);

  if (signed.length === 0) {
    return {
      binFor: () => 0,
      labels: [{ label: "0", bin: 0 }],
    };
  }

  const scale = scaleQuantile<number>().domain(signed).range([1, 2, 3, 4, 5]);

  const sorted = [...signed].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const quantiles = scale.quantiles();

  const labels: BinLabel[] = [{ label: "0", bin: 0 }];
  const boundaries = [min, ...quantiles, max + 1];
  for (let i = 0; i < 5; i++) {
    const lo = Math.ceil(boundaries[i]);
    const hi = i === 4 ? max : Math.floor(boundaries[i + 1]) - 1;
    const label =
      lo >= hi
        ? signatureFormatter.format(lo)
        : `${signatureFormatter.format(lo)}–${signatureFormatter.format(hi)}`;
    labels.push({ label, bin: i + 1 });
  }

  return {
    binFor: (count) => (count <= 0 ? 0 : scale(count)),
    labels,
  };
}
