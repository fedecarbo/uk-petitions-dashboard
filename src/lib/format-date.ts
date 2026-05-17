const shortFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const longFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateShort(iso: string | null | undefined): string | null {
  const d = parseIso(iso);
  return d ? shortFormatter.format(d) : null;
}

export function formatDateLong(iso: string | null | undefined): string | null {
  const d = parseIso(iso);
  return d ? longFormatter.format(d) : null;
}
