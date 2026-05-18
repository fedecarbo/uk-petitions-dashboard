"use client";

import type { PetitionAttributes } from "@/lib/petitions-api";
import type { PetitionHistorySample } from "@/hooks/use-petition";
import { ActivityLifecycle } from "@/components/dashboards/stats/activity-lifecycle";
import { ActivityPace } from "@/components/dashboards/stats/activity-pace";
import { ActivityTrends } from "@/components/dashboards/stats/activity-trends";
import { ActivityGeography } from "@/components/dashboards/stats/activity-geography";
import { ActivityContext } from "@/components/dashboards/stats/activity-context";
import { ActivityPulse } from "@/components/dashboards/stats/activity-pulse";

interface ActivityProps {
  attrs: PetitionAttributes;
  history: PetitionHistorySample[];
}

export function Activity({ attrs, history }: ActivityProps) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-7 text-lg font-semibold md:text-xl lg:text-2xl xl:text-3xl">
        Activity
      </h2>

      <ActivityLifecycle attrs={attrs} />
      <ActivityPace attrs={attrs} history={history} />
      <ActivityTrends attrs={attrs} />
      <ActivityGeography attrs={attrs} />
      <ActivityContext attrs={attrs} />
      <ActivityPulse attrs={attrs} history={history} />

      {/* Spacer so the last section clears the scroll edge — overflow-auto
          containers tend to clip bottom padding in WebKit. */}
      <div aria-hidden className="h-8 shrink-0 md:h-12" />
    </div>
  );
}
