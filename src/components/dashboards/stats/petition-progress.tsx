"use client";

import { useState, type ReactNode } from "react";
import type { PetitionAttributes } from "@/lib/petitions-api";
import { cn } from "@/lib/utils";

interface PetitionProgressProps {
  attrs: PetitionAttributes;
  onInteract?: () => void;
}

const numberFormatter = new Intl.NumberFormat("en-GB");
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const RESPONSE_THRESHOLD = 10_000;
const DEBATE_THRESHOLD = 100_000;
const SUMMARY_MAX_CHARS = 240;

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return dateFormatter.format(d);
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max).trimEnd();
  return `${slice}…`;
}

interface TimelineEntry {
  iso: string;
  date: string;
  title: string;
  body: ReactNode;
}

interface ResponseBodyProps {
  summary: string;
  details: string | null;
  onInteract?: () => void;
}

function ResponseBody({ summary, details, onInteract }: ResponseBodyProps) {
  const [expanded, setExpanded] = useState(false);
  const hasExtra = details !== null && details.length > 0 && details !== summary;
  const paragraphs =
    expanded && hasExtra
      ? details!
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

  return (
    <>
      <p className="italic text-foreground/85">&ldquo;{summary}&rdquo;</p>
      {expanded && paragraphs.length > 0 && (
        <div className="flex flex-col gap-2 text-foreground/85">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {hasExtra && (
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            onInteract?.();
          }}
          className="self-start text-xs font-medium text-foreground underline underline-offset-4 hover:no-underline md:text-sm lg:text-base"
        >
          {expanded ? "Show less" : "Read full response"}
        </button>
      )}
    </>
  );
}

function DebateLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-baseline gap-1 text-xs font-medium text-foreground underline underline-offset-4 hover:no-underline md:text-sm lg:text-base"
    >
      {children}
      <span aria-hidden>↗</span>
    </a>
  );
}

function buildTimeline(
  attrs: PetitionAttributes,
  onInteract?: () => void,
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  if (attrs.opened_at) {
    entries.push({
      iso: attrs.opened_at,
      date: formatDate(attrs.opened_at)!,
      title: "Petition published",
      body: (
        <>
          <p>This petition can now be signed.</p>
          {!attrs.response_threshold_reached_at && (
            <p>
              If this petition gets 10,000 signatures, government will respond
              to it.
            </p>
          )}
          {!attrs.debate_threshold_reached_at && (
            <p>
              If this petition gets 100,000 signatures, it will be considered
              for debate in Parliament.
            </p>
          )}
        </>
      ),
    });
  }

  if (attrs.response_threshold_reached_at) {
    entries.push({
      iso: attrs.response_threshold_reached_at,
      date: formatDate(attrs.response_threshold_reached_at)!,
      title: "Government will respond to this petition",
      body: (
        <p>
          This petition got more than 10,000 signatures meaning that government
          will respond to it.
        </p>
      ),
    });
  }

  if (attrs.government_response_at) {
    const summary = attrs.government_response?.summary?.trim();
    const details = attrs.government_response?.details?.trim() ?? null;
    entries.push({
      iso: attrs.government_response_at,
      date: formatDate(attrs.government_response_at)!,
      title: "Government responded to this petition",
      body: summary ? (
        <ResponseBody
          summary={summary}
          details={details}
          onInteract={onInteract}
        />
      ) : (
        <p>The government has responded to this petition.</p>
      ),
    });
  }

  if (attrs.debate_threshold_reached_at) {
    entries.push({
      iso: attrs.debate_threshold_reached_at,
      date: formatDate(attrs.debate_threshold_reached_at)!,
      title: "Petition will be considered for debate",
      body: (
        <p>
          This petition got more than 100,000 signatures meaning that it will
          be considered for debate by the Petitions Committee.
        </p>
      ),
    });
  }

  if (attrs.scheduled_debate_date) {
    const date = formatDate(attrs.scheduled_debate_date)!;
    entries.push({
      iso: attrs.scheduled_debate_date,
      date,
      title: "Scheduled for debate in Parliament",
      body: (
        <p>
          This petition has been scheduled to be debated in Parliament on {date}.
        </p>
      ),
    });
  }

  if (attrs.debate_outcome?.debated_on) {
    const overview = attrs.debate_outcome.overview?.trim();
    const videoUrl = attrs.debate_outcome.video_url;
    const transcriptUrl = attrs.debate_outcome.transcript_url;
    const packUrl = attrs.debate_outcome.debate_pack_url;
    const hasLinks = Boolean(videoUrl || transcriptUrl || packUrl);
    entries.push({
      iso: attrs.debate_outcome.debated_on,
      date: formatDate(attrs.debate_outcome.debated_on)!,
      title: "Debated in Parliament",
      body: (
        <>
          {overview ? (
            <p>{truncate(overview, SUMMARY_MAX_CHARS)}</p>
          ) : (
            <p>This petition was debated in Parliament.</p>
          )}
          {hasLinks && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {videoUrl && (
                <DebateLink href={videoUrl}>Watch debate</DebateLink>
              )}
              {transcriptUrl && (
                <DebateLink href={transcriptUrl}>Read transcript</DebateLink>
              )}
              {packUrl && (
                <DebateLink href={packUrl}>Debate pack</DebateLink>
              )}
            </div>
          )}
        </>
      ),
    });
  }

  if (attrs.rejected_at) {
    entries.push({
      iso: attrs.rejected_at,
      date: formatDate(attrs.rejected_at)!,
      title: "Petition rejected",
      body: <p>This petition was rejected and is not open for signatures.</p>,
    });
  }

  if (attrs.closed_at) {
    const closedAt = new Date(attrs.closed_at);
    if (!Number.isNaN(closedAt.getTime()) && closedAt.getTime() <= Date.now()) {
      entries.push({
        iso: attrs.closed_at,
        date: formatDate(attrs.closed_at)!,
        title: "Petition closed",
        body: (
          <p>
            This petition is now closed. It is no longer accepting signatures.
          </p>
        ),
      });
    }
  }

  entries.sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime());
  return entries;
}

interface NextTarget {
  count: number;
  caption: string;
}

function nextTarget(attrs: PetitionAttributes): NextTarget | null {
  const isClosed =
    attrs.state === "closed" ||
    attrs.state === "rejected" ||
    (attrs.closed_at !== null &&
      new Date(attrs.closed_at).getTime() <= Date.now());
  if (isClosed) return null;
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

export function PetitionProgress({ attrs, onInteract }: PetitionProgressProps) {
  const target = nextTarget(attrs);
  const entries = buildTimeline(attrs, onInteract);
  const progressPct = target
    ? Math.min(100, (attrs.signature_count / target.count) * 100)
    : null;

  return (
    <div className="flex h-full flex-col gap-5 lg:gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground md:text-sm lg:text-base xl:text-lg">
          Petition progress
        </h2>
        <p className="text-xs leading-snug text-muted-foreground/80 md:text-sm lg:text-base xl:text-lg">
          View all updates for this petition, with the most recent first.
        </p>
      </div>

      {target && progressPct !== null && (
        <div className="flex flex-col gap-2">
          <p className="font-sans text-sm leading-snug text-foreground md:text-base lg:text-lg xl:text-xl">
            <span className="font-mono font-semibold tabular-nums">
              {numberFormatter.format(attrs.signature_count)}
            </span>{" "}
            of{" "}
            <span className="font-mono font-semibold tabular-nums">
              {numberFormatter.format(target.count)}
            </span>{" "}
            signatures required {target.caption}
          </p>
          <div
            className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border lg:h-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={target.count}
            aria-valuenow={attrs.signature_count}
          >
            <div
              className="h-full bg-foreground transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <ol className="flex flex-col">
          {entries.map((entry, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === entries.length - 1;
            return (
              <li
                key={`${entry.iso}-${entry.title}`}
                className={cn(
                  "relative flex gap-3 lg:gap-4",
                  !isLast && "pb-5 lg:pb-6",
                )}
              >
                <div className="relative flex w-3 shrink-0 justify-center lg:w-3.5">
                  <span
                    aria-hidden
                    className={cn(
                      "relative z-10 mt-1.5 block h-3 w-3 rounded-full border-2 lg:h-3.5 lg:w-3.5",
                      isFirst
                        ? "border-foreground bg-foreground"
                        : "border-border bg-card",
                    )}
                  />
                  {!isLast && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-4 bottom-0 w-px -translate-x-1/2 bg-border lg:top-5"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 pb-1">
                  <span className="text-sm font-semibold leading-tight md:text-base lg:text-lg xl:text-xl">
                    {entry.date}
                  </span>
                  <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-card p-3 lg:p-4">
                    <h3 className="text-sm font-semibold leading-snug md:text-base lg:text-lg">
                      {entry.title}
                    </h3>
                    <div className="flex flex-col gap-2 text-xs leading-snug text-muted-foreground md:text-sm lg:text-base">
                      {entry.body}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
