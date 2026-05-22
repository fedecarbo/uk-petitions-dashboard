"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PetitionAttributes } from "@/lib/petitions-api";
import {
  ActivitySignaturesOverTime,
  type Range,
} from "@/components/dashboards/stats/activity-signatures";
import { Highlights } from "@/components/dashboards/stats/activity-highlights";
import { sectionShell } from "@/components/dashboards/stats/section-heading";

export function Activity({ attrs }: { attrs: PetitionAttributes }) {
  const [range, setRange] = useState<Range>("day");
  const [periodOffset, setPeriodOffset] = useState(0);

  return (
    <div className="flex h-full flex-col gap-5 lg:gap-6">
      <div className="flex flex-col gap-1.5 border-b border-border pb-5 lg:pb-6">
        <h2 className="text-3xl font-bold">Activity</h2>
        <p className="text-base leading-snug text-muted-foreground/80">
          See how signatures have built up over time.
        </p>
      </div>

      {/* Widget stack. Each widget carries `sectionShell`, whose `first:` rules
          drop the top divider on whichever widget is first — so the divider
          only ever appears *between* widgets, never above the first one. */}
      <div className="flex flex-col">
        <Highlights attrs={attrs} />

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

        {/* Spacer so the last section clears the scroll edge — overflow-auto
            containers tend to clip bottom padding in WebKit. */}
        <div aria-hidden className="h-8 shrink-0 md:h-12" />
      </div>
    </div>
  );
}
