"use client";

import type { PetitionAttributes } from "@/lib/petitions-api";
import { formatDateShort } from "@/lib/format-date";
import { SectionHeading, sectionShell } from "./section-heading";
import { cn } from "@/lib/utils";

interface Props {
  attrs: PetitionAttributes;
}

const RELATED_MAX = 2;

export function ActivityContext({ attrs }: Props) {
  const departments = attrs.departments;
  const topics = attrs.topics;
  const related = [...attrs.other_parliamentary_business]
    .sort((a, b) => {
      const at = a.occurred_on ? new Date(a.occurred_on).getTime() : 0;
      const bt = b.occurred_on ? new Date(b.occurred_on).getTime() : 0;
      return bt - at;
    })
    .slice(0, RELATED_MAX);

  if (
    departments.length === 0 &&
    topics.length === 0 &&
    related.length === 0
  ) {
    return null;
  }

  return (
    <section className={cn(sectionShell, "gap-4")}>
      <SectionHeading>Context</SectionHeading>

      <dl className="flex flex-col gap-3 text-xs md:text-sm">
        {departments.length > 0 && (
          <Row label={departments.length === 1 ? "Department" : "Departments"}>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              {departments.map((d, i) => (
                <span key={d.name} className="flex items-baseline">
                  {i > 0 && (
                    <span className="mr-1.5 text-muted-foreground/50">·</span>
                  )}
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-foreground underline underline-offset-2 hover:text-primary"
                    >
                      {d.name}
                    </a>
                  ) : (
                    <span className="text-foreground">{d.name}</span>
                  )}
                </span>
              ))}
            </div>
          </Row>
        )}

        {topics.length > 0 && (
          <Row label="Topics">
            <span className="text-foreground">
              {topics.map((t) => t.name).join(", ")}
            </span>
          </Row>
        )}

        {related.length > 0 && (
          <Row label="Related">
            <ul className="flex flex-col gap-2">
              {related.map((r) => (
                <li
                  key={`${r.subject}-${r.created_at}`}
                  className="flex flex-col gap-0.5 leading-snug"
                >
                  <span className="text-foreground">{r.subject}</span>
                  {r.occurred_on && (
                    <span className="text-[11px] text-muted-foreground/80 md:text-xs">
                      {formatDateShort(r.occurred_on)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Row>
        )}
      </dl>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 items-baseline md:grid-cols-[6.5rem_minmax(0,1fr)]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
