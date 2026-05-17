"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { PetitionStatus } from "@/components/petition-status";
import { ConstituencyBar } from "@/components/dashboards/constituency-bar";
import { ConstituencyDetail } from "@/components/dashboards/constituency-detail";
import {
  ConstituencySearch,
  type ConstituencyOption,
} from "@/components/dashboards/constituency-search";
import {
  UKConstituencyMap,
  type UKConstituencyMapHandle,
} from "@/components/dashboards/uk-constituency-map";
import { signatureFormatter } from "@/lib/format";
import { buildBinScale } from "@/lib/uk-constituencies";
import type { PetitionAttributes } from "@/lib/petitions-api";

interface MapModeProps {
  attrs: PetitionAttributes;
}

const TOP_N = 10;

export function MapMode({ attrs }: MapModeProps) {
  const constituencies = attrs.signatures_by_constituency;

  const topAreas = useMemo(
    () =>
      [...constituencies]
        .sort((a, b) => b.signature_count - a.signature_count)
        .slice(0, TOP_N),
    [constituencies],
  );
  const topCount = topAreas[0]?.signature_count || 1;

  const rankByCode = useMemo(() => {
    const signed = constituencies
      .filter((c) => c.signature_count > 0)
      .sort((a, b) => b.signature_count - a.signature_count);
    const map = new Map<string, number>();
    signed.forEach((c, i) => map.set(c.ons_code, i + 1));
    return { map, totalSigned: signed.length };
  }, [constituencies]);

  const totalConstituencySignatures = useMemo(
    () => constituencies.reduce((sum, c) => sum + c.signature_count, 0),
    [constituencies],
  );

  const binScale = useMemo(() => buildBinScale(constituencies), [constituencies]);

  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const mapRef = useRef<UKConstituencyMapHandle>(null);

  const effectiveActive = selectedCode ?? hoverCode;

  const toggleSelect = useCallback((code: string) => {
    setSelectedCode((prev) => (prev === code ? null : code));
  }, []);

  const searchOptions = useMemo<ConstituencyOption[]>(
    () =>
      constituencies.map((c) => ({
        code: c.ons_code,
        name: c.name,
        mp: c.mp,
      })),
    [constituencies],
  );

  const selectedConstituency = selectedCode
    ? constituencies.find((c) => c.ons_code === selectedCode) ?? null
    : null;

  return (
    <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:overflow-hidden">
      <section
        aria-label="Constituency map"
        className="relative min-h-[360px] min-w-0 border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r"
      >
        <UKConstituencyMap
          ref={mapRef}
          signaturesByConstituency={constituencies}
          activeCode={effectiveActive}
          onActiveChange={setHoverCode}
          onSelect={toggleSelect}
        />
      </section>

      <aside
        aria-label="Petition summary and top constituencies"
        className="flex min-w-0 flex-col lg:min-h-0"
      >
        <section
          aria-label="Petition identity"
          className="flex flex-col gap-3 border-b border-border p-6 md:gap-4 md:p-8 lg:shrink-0 lg:gap-4 lg:p-8"
        >
          <PetitionStatus state={attrs.state} />
          <h1 className="text-lg leading-tight font-semibold tracking-tight text-balance md:text-xl lg:text-xl xl:text-2xl 2xl:text-3xl">
            {attrs.action}
          </h1>
          <div className="flex items-baseline gap-2 lg:gap-3">
            <span
              aria-label={`${signatureFormatter.format(attrs.signature_count)} signatures`}
              className="font-mono text-3xl font-bold tracking-tight tabular-nums md:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl leading-none"
            >
              {signatureFormatter.format(attrs.signature_count)}
            </span>
            <span className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base">
              Signatures
            </span>
          </div>
        </section>

        <section
          aria-label="Constituency explorer"
          className="flex flex-1 flex-col gap-4 p-6 md:gap-5 md:p-8 lg:min-h-0 lg:gap-5 lg:overflow-y-auto lg:p-8"
        >
          {selectedConstituency ? (
            <ConstituencyDetail
              name={selectedConstituency.name}
              mpFromPetition={selectedConstituency.mp}
              signatureCount={selectedConstituency.signature_count}
              rank={rankByCode.map.get(selectedConstituency.ons_code) ?? null}
              totalSigned={rankByCode.totalSigned}
              share={
                totalConstituencySignatures > 0
                  ? selectedConstituency.signature_count /
                    totalConstituencySignatures
                  : null
              }
              binLabel={binLabelFor(
                binScale.binFor(selectedConstituency.signature_count),
              )}
              onBack={() => setSelectedCode(null)}
              onZoomHere={() =>
                mapRef.current?.focusConstituency(selectedConstituency.ons_code)
              }
            />
          ) : (
            <DefaultView
              searchOptions={searchOptions}
              onSearchSelect={(code) => {
                setSelectedCode(code);
                mapRef.current?.focusConstituency(code);
              }}
              topAreas={topAreas}
              topCount={topCount}
              effectiveActive={effectiveActive}
              setHoverCode={setHoverCode}
              toggleSelect={toggleSelect}
            />
          )}
        </section>
      </aside>
    </div>
  );
}

interface DefaultViewProps {
  searchOptions: ConstituencyOption[];
  onSearchSelect: (code: string) => void;
  topAreas: PetitionAttributes["signatures_by_constituency"];
  topCount: number;
  effectiveActive: string | null;
  setHoverCode: Dispatch<SetStateAction<string | null>>;
  toggleSelect: (code: string) => void;
}

function DefaultView({
  searchOptions,
  onSearchSelect,
  topAreas,
  topCount,
  effectiveActive,
  setHoverCode,
  toggleSelect,
}: DefaultViewProps) {
  return (
    <>
      {searchOptions.length > 0 && (
        <ConstituencySearch
          constituencies={searchOptions}
          onSelect={onSearchSelect}
        />
      )}

      <div className="flex flex-1 flex-col gap-2 lg:gap-3">
        <h2 className="text-xs font-medium text-muted-foreground md:text-sm lg:text-base">
          Top constituencies
        </h2>
        {topAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground md:text-base">
            No constituency data yet.
          </p>
        ) : (
          <ol className="flex flex-col gap-2 lg:gap-2.5">
            {topAreas.map((item) => {
              const widthPct = Math.max(
                4,
                (item.signature_count / topCount) * 100,
              );
              const code = item.ons_code;
              return (
                <ConstituencyBar
                  key={code}
                  name={item.name}
                  mp={item.mp}
                  signatureCount={item.signature_count}
                  widthPct={widthPct}
                  isActive={code === effectiveActive}
                  onMouseEnter={() => setHoverCode(code)}
                  onMouseLeave={() =>
                    setHoverCode((c) => (c === code ? null : c))
                  }
                  onFocus={() => setHoverCode(code)}
                  onBlur={() =>
                    setHoverCode((c) => (c === code ? null : c))
                  }
                  onClick={() => toggleSelect(code)}
                />
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}

function binLabelFor(bin: number): string | null {
  switch (bin) {
    case 5:
      return "Top 20% by signatures";
    case 4:
      return "Top 21–40%";
    case 3:
      return "Top 41–60%";
    case 2:
      return "Top 61–80%";
    case 1:
      return "Bottom 20% of signed";
    case 0:
    default:
      return null;
  }
}
