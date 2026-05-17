export function parsePetitionId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) return trimmed;

  const urlMatch = trimmed.match(/petition\.parliament\.uk\/petitions\/(\d+)/i);
  if (urlMatch) return urlMatch[1];

  return null;
}
