export type PetitionState =
  | "open"
  | "closed"
  | "rejected"
  | "awaiting_response"
  | "with_response"
  | "awaiting_debate"
  | "debated"
  | "not_debated";

export interface PetitionAttributes {
  action: string;
  background: string | null;
  additional_details: string | null;
  state: PetitionState;
  signature_count: number;
  created_at: string;
  updated_at: string;
  opened_at: string | null;
  closed_at: string | null;
  rejected_at: string | null;
  government_response_at: string | null;
  scheduled_debate_date: string | null;
  debate_threshold_reached_at: string | null;
  response_threshold_reached_at: string | null;
  moderation_threshold_reached_at: string | null;
  government_response: {
    summary: string;
    details: string;
    created_at: string;
    updated_at: string;
  } | null;
  debate_outcome: {
    debated_on: string | null;
    overview: string | null;
    transcript_url: string | null;
    video_url: string | null;
    debate_pack_url: string | null;
  } | null;
  signatures_by_country: Array<{
    name: string;
    code: string;
    signature_count: number;
  }>;
  signatures_by_constituency: Array<{
    name: string;
    ons_code: string;
    mp: string | null;
    signature_count: number;
  }>;
}

export interface PetitionResponse {
  data: {
    type: "petition";
    id: number;
    attributes: PetitionAttributes;
  };
  links: { self: string };
}

const UPSTREAM = "https://petition.parliament.uk";

export async function fetchPetition(id: string): Promise<PetitionResponse> {
  const res = await fetch(`${UPSTREAM}/petitions/${id}.json`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Upstream returned ${res.status}`);
  }

  return res.json();
}
