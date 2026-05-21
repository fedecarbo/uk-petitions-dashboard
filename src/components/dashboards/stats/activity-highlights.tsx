"use client";

import { useParams, useRouter } from "next/navigation";
import type { PetitionAttributes } from "@/lib/petitions-api";
import { signatureFormatter } from "@/lib/format";
import { peakDay, peakMonth } from "@/lib/petition-timeline";
import { SampleBadge } from "./section-heading";

interface Props {
  attrs: PetitionAttributes;
  onFocusDay: (ts: number) => void;
  onFocusMonth: (ts: number) => void;
}

const WEEKDAY_DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "long" });

export function ActivityHighlights({ attrs, onFocusDay, onFocusMonth }: Props) {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const topRegion = [...attrs.signatures_by_region].sort(
    (a, b) => b.signature_count - a.signature_count,
  )[0];
  const day = peakDay();
  const month = peakMonth();

  if (!topRegion && !day && !month) return null;

  const goToMap = () => {
    if (params?.id) router.push(`/p/${params.id}?view=map`);
  };

  return (
    <section className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border text-lg leading-relaxed text-muted-foreground">
        {topRegion ? (
          <li className="py-2.5 first:pt-0 last:pb-0">
            The region with the most signatures is{" "}
            <Token onClick={goToMap}>{topRegion.name}</Token>, with{" "}
            <Count>
              {signatureFormatter.format(topRegion.signature_count)}
            </Count>
            .
          </li>
        ) : null}
        {month ? (
          <li className="py-2.5 first:pt-0 last:pb-0">
            The month with the most signatures was{" "}
            <Token onClick={() => onFocusMonth(month.ts)}>
              {MONTH_FMT.format(new Date(month.ts))}
            </Token>
            , with <Count>{signatureFormatter.format(month.total)}</Count>.
          </li>
        ) : null}
        {day ? (
          <li className="py-2.5 first:pt-0 last:pb-0">
            The day with the most signatures was{" "}
            <Token onClick={() => onFocusDay(day.ts)}>
              {WEEKDAY_DATE_FMT.format(new Date(day.ts))}
            </Token>
            , with <Count>{signatureFormatter.format(day.total)}</Count>.
          </li>
        ) : null}
      </ul>

      {day || month ? (
        <div className="flex items-center gap-2 text-base text-muted-foreground">
          <SampleBadge />
          <span>Day and month figures are from a sample timeline.</span>
        </div>
      ) : null}
    </section>
  );
}

function Token({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="box-decoration-clone cursor-pointer rounded bg-primary/10 px-1.5 font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="box-decoration-clone rounded bg-muted px-1.5 font-medium tabular-nums text-foreground">
      {children}
    </span>
  );
}
