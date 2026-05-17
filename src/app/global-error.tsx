"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-GB">
      <body className="grid min-h-dvh place-items-center bg-background px-6 text-foreground">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Something went wrong
          </p>
          <p className="text-base">{error.message || "Unexpected error."}</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
