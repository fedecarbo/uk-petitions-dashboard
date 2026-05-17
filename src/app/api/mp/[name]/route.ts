import { NextRequest, NextResponse } from "next/server";
import type { MPContact } from "@/lib/mp-api";

export const dynamic = "force-dynamic";

const UPSTREAM = "https://members-api.parliament.uk/api";

// In-memory cache keyed by lowercased constituency name. MP info is
// essentially static between elections; the kiosk process can hold this
// forever. A restart re-fetches.
const cache = new Map<string, MPContact>();

interface SearchResponse {
  items?: Array<{
    value?: {
      currentRepresentation?: {
        member?: {
          value?: {
            id: number;
            nameDisplayAs: string;
            thumbnailUrl?: string;
            latestParty?: {
              name: string;
              abbreviation: string;
            };
          };
        };
      };
    };
  }>;
}

interface ContactEntry {
  type: string;
  line1: string | null;
  phone: string | null;
  email: string | null;
}

interface ContactResponse {
  value?: ContactEntry[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName).trim();

  if (!name) {
    return NextResponse.json(
      { error: "Constituency name is required" },
      { status: 400 },
    );
  }

  const cacheKey = name.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "cache-control": "no-store" },
    });
  }

  try {
    const searchUrl = `${UPSTREAM}/Location/Constituency/Search?searchText=${encodeURIComponent(name)}&skip=0&take=1`;
    const searchRes = await fetch(searchUrl, {
      headers: { accept: "application/json" },
    });
    if (!searchRes.ok) {
      throw new Error(`Constituency search returned ${searchRes.status}`);
    }
    const search = (await searchRes.json()) as SearchResponse;

    const member = search.items?.[0]?.value?.currentRepresentation?.member?.value;
    if (!member) {
      return NextResponse.json(
        { error: `No current MP found for "${name}"` },
        { status: 404 },
      );
    }

    const contactRes = await fetch(`${UPSTREAM}/Members/${member.id}/Contact`, {
      headers: { accept: "application/json" },
    });
    if (!contactRes.ok) {
      throw new Error(`Contact lookup returned ${contactRes.status}`);
    }
    const contact = (await contactRes.json()) as ContactResponse;

    const entries = contact.value ?? [];
    const office =
      entries.find((c) => c.type === "Parliamentary office") ??
      entries.find((c) => c.type === "Constituency office");
    const website = entries.find((c) => c.type === "Website");
    const twitter = entries.find(
      (c) =>
        c.type === "X (formerly Twitter)" ||
        c.type.toLowerCase().includes("twitter"),
    );

    const result: MPContact = {
      name: member.nameDisplayAs,
      party: member.latestParty?.name ?? "",
      partyAbbr: member.latestParty?.abbreviation ?? "",
      parliamentUrl: `https://members.parliament.uk/member/${member.id}`,
      thumbnailUrl: member.thumbnailUrl ?? null,
      email: office?.email ?? null,
      phone: office?.phone ?? null,
      website: website?.line1 ?? null,
      twitter: twitter?.line1 ?? null,
    };

    cache.set(cacheKey, result);
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
