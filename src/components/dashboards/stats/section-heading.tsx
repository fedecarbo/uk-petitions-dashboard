import { cn } from "@/lib/utils";

// Shared spacing + divider for every Activity section. `first:` modifiers
// suppress the divider on whichever section ends up being :first-child in the
// DOM — important because some sections return null on certain petitions, so
// "first" can shift.
export const sectionShell = cn(
  "flex flex-col",
  "mt-7 border-t border-border pt-7",
  "first:mt-0 first:border-t-0 first:pt-0",
);

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground md:text-sm">
      {children}
    </h3>
  );
}

export function SampleBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 px-1.5 py-0 text-[10px] leading-4 font-medium text-muted-foreground"
      title="Real captured timeline for petition 751472, used as a single example regardless of which petition is loaded."
    >
      <span aria-hidden className="size-1 rounded-full bg-muted-foreground/60" />
      Sample data
    </span>
  );
}
