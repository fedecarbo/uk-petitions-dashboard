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
