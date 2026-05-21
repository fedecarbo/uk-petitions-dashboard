"use client";

import { useState } from "react";
import type { PetitionAttributes } from "@/lib/petitions-api";
import { ActivityHighlights } from "@/components/dashboards/stats/activity-highlights";
import {
  ActivitySignaturesOverTime,
  dayOffsetFrom,
  monthOffsetFrom,
  type Range,
} from "@/components/dashboards/stats/activity-signatures";
import { ActivityGeography } from "@/components/dashboards/stats/activity-geography";
import { ActivityContext } from "@/components/dashboards/stats/activity-context";
import { PETITION_TIMELINE_META } from "@/lib/petition-timeline";

interface ActivityProps {
  attrs: PetitionAttributes;
}

export function Activity({ attrs }: ActivityProps) {
  const [range, setRange] = useState<Range>("day");
  const [periodOffset, setPeriodOffset] = useState(0);

  const focusDay = (ts: number) => {
    setRange("day");
    setPeriodOffset(dayOffsetFrom(PETITION_TIMELINE_META.captured_at, ts));
  };
  const focusMonth = (ts: number) => {
    setRange("month");
    setPeriodOffset(monthOffsetFrom(PETITION_TIMELINE_META.captured_at, ts));
  };

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-7 text-2xl font-semibold">
        Activity
      </h2>

      <ActivityHighlights
        attrs={attrs}
        onFocusDay={focusDay}
        onFocusMonth={focusMonth}
      />
      <ActivitySignaturesOverTime
        range={range}
        setRange={setRange}
        periodOffset={periodOffset}
        setPeriodOffset={setPeriodOffset}
      />
      <ActivityGeography attrs={attrs} />
      <ActivityContext attrs={attrs} />

      {/* Spacer so the last section clears the scroll edge — overflow-auto
          containers tend to clip bottom padding in WebKit. */}
      <div aria-hidden className="h-8 shrink-0 md:h-12" />
    </div>
  );
}
