import { DashboardCentered } from "@/components/dashboards/centered";
import { DashboardSplit } from "@/components/dashboards/split";

const LAYOUTS = ["split", "centered"] as const;
type LayoutVariant = (typeof LAYOUTS)[number];

const DEFAULT_LAYOUT: LayoutVariant = "split";

function resolveLayout(raw: string | string[] | undefined): LayoutVariant {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (LAYOUTS as readonly string[]).includes(value ?? "")
    ? (value as LayoutVariant)
    : DEFAULT_LAYOUT;
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ layout?: string | string[] }>;
}

export default async function PetitionDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const layout = resolveLayout(search.layout);

  if (layout === "centered") return <DashboardCentered id={id} />;
  return <DashboardSplit id={id} />;
}
