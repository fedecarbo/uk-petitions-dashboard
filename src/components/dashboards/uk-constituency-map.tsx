"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { geoMercator, geoPath } from "d3-geo";
import { select } from "d3-selection";
import {
  zoom,
  zoomIdentity,
  type D3ZoomEvent,
  type ZoomBehavior,
  type ZoomTransform,
} from "d3-zoom";
import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  BIN_FILL_CLASS,
  BIN_LABELS,
  binFor,
  loadConstituencies,
  type ConstituencyCollection,
  type ConstituencyFeature,
} from "@/lib/uk-constituencies";
import { signatureFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";

interface UKConstituencyMapProps {
  signaturesByConstituency: Array<{
    ons_code: string;
    name: string;
    signature_count: number;
  }>;
}

const VIEWBOX_WIDTH = 600;
const VIEWBOX_HEIGHT = 800;
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;
const ZOOM_STEP = 1.6;
const PAN_STEP = 60;
const ZOOM_ANIM_MS = 200;

interface PreparedPath {
  code: string;
  name: string;
  d: string;
}

function prepareFeatures(collection: ConstituencyCollection): PreparedPath[] {
  const projection = geoMercator().fitSize(
    [VIEWBOX_WIDTH, VIEWBOX_HEIGHT],
    collection,
  );
  const path = geoPath(projection);
  return collection.features
    .map((f: ConstituencyFeature) => ({
      code: f.properties.PCON24CD,
      name: f.properties.PCON24NM,
      d: path(f) ?? "",
    }))
    .filter((p) => p.d.length > 0);
}

export function UKConstituencyMap({
  signaturesByConstituency,
}: UKConstituencyMapProps) {
  const [paths, setPaths] = useState<PreparedPath[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadConstituencies()
      .then((collection) => {
        if (cancelled) return;
        setPaths(prepareFeatures(collection));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load map";
        setError(message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!paths || !svgRef.current || !groupRef.current) return;
    const svgEl = svgRef.current;
    const groupEl = groupRef.current;

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .translateExtent([
        [0, 0],
        [VIEWBOX_WIDTH, VIEWBOX_HEIGHT],
      ])
      // d3-zoom's default amplifies pinch (ctrl+wheel from trackpads) 10× —
      // jumpy on macOS. 3× feels gradual while still distinguishing pinch
      // from regular scroll-zoom.
      .wheelDelta((event) => {
        const base =
          -event.deltaY *
          (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002);
        return base * (event.ctrlKey ? 3 : 1);
      })
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const t: ZoomTransform = event.transform;
        groupEl.setAttribute("transform", t.toString());
        setZoomLevel(t.k);
      });

    select(svgEl).call(behavior);
    zoomRef.current = behavior;

    return () => {
      select(svgEl).on(".zoom", null);
      zoomRef.current = null;
    };
  }, [paths]);

  const scaleBy = useCallback((factor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current)
      .transition()
      .duration(ZOOM_ANIM_MS)
      .call(zoomRef.current.scaleBy, factor);
  }, []);

  const translateBy = useCallback((dx: number, dy: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current)
      .transition()
      .duration(ZOOM_ANIM_MS)
      .call(zoomRef.current.translateBy, dx, dy);
  }, []);

  const reset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current)
      .transition()
      .duration(ZOOM_ANIM_MS)
      .call(zoomRef.current.transform, zoomIdentity);
  }, []);

  const lookup = useMemo(() => {
    const m = new Map<string, { count: number; name: string }>();
    for (const c of signaturesByConstituency) {
      m.set(c.ons_code, { count: c.signature_count, name: c.name });
    }
    return m;
  }, [signaturesByConstituency]);

  const activeInfo = activeCode
    ? (() => {
        const pathEntry = paths?.find((p) => p.code === activeCode);
        if (!pathEntry) return null;
        const data = lookup.get(activeCode);
        return {
          name: data?.name ?? pathEntry.name,
          count: data?.count ?? 0,
        };
      })()
    : null;

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    switch (event.key) {
      case "+":
      case "=":
        event.preventDefault();
        scaleBy(ZOOM_STEP);
        break;
      case "-":
      case "_":
        event.preventDefault();
        scaleBy(1 / ZOOM_STEP);
        break;
      case "0":
      case "Home":
        event.preventDefault();
        reset();
        break;
      case "ArrowUp":
        event.preventDefault();
        translateBy(0, PAN_STEP);
        break;
      case "ArrowDown":
        event.preventDefault();
        translateBy(0, -PAN_STEP);
        break;
      case "ArrowLeft":
        event.preventDefault();
        translateBy(PAN_STEP, 0);
        break;
      case "ArrowRight":
        event.preventDefault();
        translateBy(-PAN_STEP, 0);
        break;
    }
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Couldn’t load the map: {error}
      </div>
    );
  }

  if (!paths) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Loading constituencies…
      </div>
    );
  }

  const zoomedIn = zoomLevel >= ZOOM_MAX - 0.01;
  const zoomedOut = zoomLevel <= ZOOM_MIN + 0.01;

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full cursor-grab touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        role="img"
        aria-label="Choropleth map of UK constituencies by signature count. Drag to pan, scroll to zoom, or use the controls below."
        aria-keyshortcuts="Plus Minus 0 ArrowUp ArrowDown ArrowLeft ArrowRight"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <g ref={groupRef} className="stroke-border" strokeWidth={0.4}>
          {paths.map((p) => {
            const data = lookup.get(p.code);
            const count = data?.count ?? 0;
            const bin = binFor(count);
            const isActive = p.code === activeCode;
            return (
              <path
                key={p.code}
                d={p.d}
                className={cn(
                  BIN_FILL_CLASS[bin],
                  "transition-[stroke-width] duration-100",
                  isActive && "stroke-foreground",
                )}
                strokeWidth={isActive ? 1.2 : 0.4}
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setActiveCode(p.code)}
                onMouseLeave={() =>
                  setActiveCode((c) => (c === p.code ? null : c))
                }
                onFocus={() => setActiveCode(p.code)}
                onBlur={() =>
                  setActiveCode((c) => (c === p.code ? null : c))
                }
              >
                <title>{`${p.name}: ${signatureFormatter.format(count)} signatures`}</title>
              </path>
            );
          })}
        </g>
      </svg>

      <span className="sr-only">
        Map keyboard controls: plus to zoom in, minus to zoom out, zero to
        reset, arrow keys to pan.
      </span>

      <Legend />

      <ZoomControls
        zoomedIn={zoomedIn}
        zoomedOut={zoomedOut}
        onZoomIn={() => scaleBy(ZOOM_STEP)}
        onZoomOut={() => scaleBy(1 / ZOOM_STEP)}
        onReset={reset}
        canReset={zoomLevel > ZOOM_MIN + 0.01}
      />

      {activeInfo && (
        <div className="pointer-events-none absolute right-4 top-4 max-w-[16rem] rounded-md border border-border bg-card/95 px-3 py-2 text-sm shadow-sm backdrop-blur">
          <div className="font-medium leading-tight">{activeInfo.name}</div>
          <div className="font-mono tabular-nums text-muted-foreground">
            {signatureFormatter.format(activeInfo.count)} signatures
          </div>
        </div>
      )}
    </div>
  );
}

interface ZoomControlsProps {
  zoomedIn: boolean;
  zoomedOut: boolean;
  canReset: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

function ZoomControls({
  zoomedIn,
  zoomedOut,
  canReset,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  return (
    <div
      role="group"
      aria-label="Map zoom"
      className="absolute right-3 bottom-3 flex flex-col overflow-hidden rounded-md border border-border bg-card/95 shadow-sm backdrop-blur"
    >
      <ZoomButton
        label="Zoom in"
        disabled={zoomedIn}
        onClick={onZoomIn}
      >
        <Plus aria-hidden className="h-4 w-4" />
      </ZoomButton>
      <ZoomButton
        label="Zoom out"
        disabled={zoomedOut}
        onClick={onZoomOut}
        bordered
      >
        <Minus aria-hidden className="h-4 w-4" />
      </ZoomButton>
      <ZoomButton
        label="Reset zoom and pan"
        disabled={!canReset}
        onClick={onReset}
        bordered
      >
        <RotateCcw aria-hidden className="h-3.5 w-3.5" />
      </ZoomButton>
    </div>
  );
}

function ZoomButton({
  label,
  disabled,
  onClick,
  bordered,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center text-foreground transition-colors lg:h-9 lg:w-9",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        "disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:bg-transparent",
        bordered && "border-t border-border",
      )}
    >
      {children}
    </button>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1 rounded-md border border-border bg-card/90 px-2 py-1.5 text-[10px] text-muted-foreground backdrop-blur lg:text-xs">
      <div className="flex items-center gap-1">
        {BIN_LABELS.map((entry) => (
          <span
            key={entry.bin}
            aria-hidden
            className={cn(
              "block h-3 w-4 border border-border/40 lg:h-3.5 lg:w-5",
              BIN_FILL_CLASS[entry.bin],
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 font-mono tabular-nums">
        <span>{BIN_LABELS[0].label}</span>
        <span>{BIN_LABELS[BIN_LABELS.length - 1].label}</span>
      </div>
    </div>
  );
}
