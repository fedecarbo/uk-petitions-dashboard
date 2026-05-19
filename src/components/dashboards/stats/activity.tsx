"use client";

import type { PetitionAttributes } from "@/lib/petitions-api";
import type { PetitionHistorySample } from "@/hooks/use-petition";
import { ActivityPace } from "@/components/dashboards/stats/activity-pace";
import { ActivitySignaturesOverTime } from "@/components/dashboards/stats/activity-signatures";
import { ActivityGeography } from "@/components/dashboards/stats/activity-geography";
import { ActivityLifecycle } from "@/components/dashboards/stats/activity-lifecycle";
import { ActivityContext } from "@/components/dashboards/stats/activity-context";

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

      <ActivityPace attrs={attrs} history={history} />
      <ActivitySignaturesOverTime />
      <ActivityGeography attrs={attrs} />
      <ActivityLifecycle attrs={attrs} />
      <ActivityContext attrs={attrs} />

      {/* Spacer so the last section clears the scroll edge — overflow-auto
          containers tend to clip bottom padding in WebKit. */}
      <div aria-hidden className="h-8 shrink-0 md:h-12" />
    </div>
  );
}
