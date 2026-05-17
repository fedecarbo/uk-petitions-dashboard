import Link from "next/link";

interface DashboardLoadingProps {
  id: string;
}

export function DashboardLoading({ id }: DashboardLoadingProps) {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
        Loading petition #{id}…
      </p>
    </main>
  );
}

interface DashboardErrorProps {
  id: string;
  message: string;
}

export function DashboardError({ id, message }: DashboardErrorProps) {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Couldn’t load petition #{id}
        </p>
        <p className="text-base">{message}</p>
        <Link
          href="/"
          className="text-sm font-medium underline underline-offset-4"
        >
          ← Back to search
        </Link>
      </div>
    </main>
  );
}
