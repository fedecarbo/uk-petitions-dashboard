import { DashboardSplit } from "@/components/dashboards/split";
import type { DashboardView } from "@/components/dashboards/view-toggle";

const VIEWS = ["stats", "map"] as const;
const DEFAULT_VIEW: DashboardView = "stats";

function resolveView(raw: string | string[] | undefined): DashboardView {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (VIEWS as readonly string[]).includes(value ?? "")
    ? (value as DashboardView)
    : DEFAULT_VIEW;
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}

export default async function PetitionDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const view = resolveView(search.view);

  return <DashboardSplit id={id} view={view} />;
}
