import { DashboardCentered } from "@/components/dashboards/centered";
import { DashboardSplit } from "@/components/dashboards/split";
import type { DashboardView } from "@/components/dashboards/view-toggle";

const LAYOUTS = ["split", "centered"] as const;
type LayoutVariant = (typeof LAYOUTS)[number];

const DEFAULT_LAYOUT: LayoutVariant = "split";

const VIEWS = ["stats", "map"] as const;
const DEFAULT_VIEW: DashboardView = "stats";

function resolveLayout(raw: string | string[] | undefined): LayoutVariant {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (LAYOUTS as readonly string[]).includes(value ?? "")
    ? (value as LayoutVariant)
    : DEFAULT_LAYOUT;
}

function resolveView(raw: string | string[] | undefined): DashboardView {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (VIEWS as readonly string[]).includes(value ?? "")
    ? (value as DashboardView)
    : DEFAULT_VIEW;
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ layout?: string | string[]; view?: string | string[] }>;
}

export default async function PetitionDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const layout = resolveLayout(search.layout);
  const view = resolveView(search.view);

  if (layout === "centered") return <DashboardCentered id={id} />;
  return <DashboardSplit id={id} view={view} />;
}
