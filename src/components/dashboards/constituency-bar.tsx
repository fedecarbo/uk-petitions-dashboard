import { signatureFormatter } from "@/lib/format";

interface ConstituencyBarProps {
  name: string;
  mp: string | null;
  signatureCount: number;
  widthPct: number;
}

export function ConstituencyBar({
  name,
  mp,
  signatureCount,
  widthPct,
}: ConstituencyBarProps) {
  return (
    <li className="relative overflow-hidden rounded-md border border-border/40">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-foreground/[0.06]"
        style={{ width: `${widthPct}%` }}
      />
      <div className="relative flex items-baseline justify-between gap-3 px-3 py-2 lg:px-4 lg:py-2.5">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium md:text-base lg:text-lg">
            {name}
          </span>
          {mp && (
            <span className="truncate text-xs text-muted-foreground md:text-sm lg:text-base">
              {mp}
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums md:text-base lg:text-lg">
          {signatureFormatter.format(signatureCount)}
        </span>
      </div>
    </li>
  );
}
