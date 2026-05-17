export interface MPContact {
  name: string;
  party: string;
  partyAbbr: string;
  parliamentUrl: string;
  thumbnailUrl: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  twitter: string | null;
}

export async function fetchMP(constituencyName: string): Promise<MPContact> {
  const res = await fetch(`/api/mp/${encodeURIComponent(constituencyName)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `MP lookup failed (${res.status})`);
  }
  return res.json();
}
