"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ActivitySignaturesOverTime,
  type Range,
} from "@/components/dashboards/stats/activity-signatures";
import { sectionShell } from "@/components/dashboards/stats/section-heading";

export function Activity() {
  const [range, setRange] = useState<Range>("day");
  const [periodOffset, setPeriodOffset] = useState(0);

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-7 text-2xl font-semibold">Activity</h2>

      {/* Widget stack. Each widget carries `sectionShell`, whose `first:` rules
          drop the top divider on whichever widget is first — so the divider
          only ever appears *between* widgets, never above the first one. */}
      <div className="flex flex-col">
        <ActivitySignaturesOverTime
          range={range}
          setRange={setRange}
          periodOffset={periodOffset}
          setPeriodOffset={setPeriodOffset}
        />

        {/* Placeholder slot for the next widget — remove when real content lands. */}
        <section className={cn(sectionShell, "gap-4")}>
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border/70 text-base text-muted-foreground/70 md:h-28">
            Another widget coming soon
          </div>
        </section>
      </div>

      {/* Spacer so the last section clears the scroll edge — overflow-auto
          containers tend to clip bottom padding in WebKit. */}
      <div aria-hidden className="h-8 shrink-0 md:h-12" />
    </div>
  );
}
