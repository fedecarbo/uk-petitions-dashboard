"use client";

import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Locate,
} from "lucide-react";
import { useMP } from "@/hooks/use-mp";
import { signatureFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ConstituencyDetailProps {
  name: string;
  mpFromPetition: string | null;
  signatureCount: number;
  rank: number | null;
  totalSigned: number;
  share: number | null;
  onBack: () => void;
  onZoomHere: () => void;
}

const percentFormatter = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function ConstituencyDetail({
  name,
  mpFromPetition,
  signatureCount,
  rank,
  totalSigned,
  share,
  onBack,
  onZoomHere,
}: ConstituencyDetailProps) {
  const mp = useMP(name);

  const hasSigs = signatureCount > 0;

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1.5 inline-flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft aria-hidden size={14} />
        Back
      </button>

      <div className="flex flex-col gap-1">
        <h3 className="text-2xl leading-tight font-semibold tracking-tight text-balance">
          {name}
        </h3>
        <MPHeader mp={mp} fallback={mpFromPetition} />
      </div>

      <div className="flex items-baseline gap-2">
        <span
          aria-label={`${signatureFormatter.format(signatureCount)} signatures`}
          className="font-mono text-4xl font-bold tabular-nums"
        >
          {signatureFormatter.format(signatureCount)}
        </span>
        <span className="text-base font-medium text-muted-foreground">
          Signatures
        </span>
      </div>

      {hasSigs ? (
        <dl className="flex flex-col gap-1.5 text-base">
          {rank !== null && (
            <Fact
              label="Rank"
              value={`#${signatureFormatter.format(rank)} of ${signatureFormatter.format(totalSigned)} signed`}
            />
          )}
          {share !== null && (
            <Fact label="Share" value={`${percentFormatter.format(share)} of UK total`} />
          )}
        </dl>
      ) : (
        <p className="text-base text-muted-foreground">
          No signatures yet from this constituency.
        </p>
      )}

      <MPContactBlock mp={mp} />

      <button
        type="button"
        onClick={onZoomHere}
        className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Locate aria-hidden size={14} />
        Zoom here
      </button>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function MPHeader({
  mp,
  fallback,
}: {
  mp: ReturnType<typeof useMP>;
  fallback: string | null;
}) {
  if (mp.status === "ready") {
    return (
      <p className="text-base text-muted-foreground">
        {mp.data.name}
        {mp.data.party && (
          <>
            <span aria-hidden className="mx-1.5 text-muted-foreground/50">
              ·
            </span>
            <span>{mp.data.party}</span>
          </>
        )}
      </p>
    );
  }
  if (mp.status === "loading") {
    return (
      <span
        aria-hidden
        className="h-4 w-40 animate-pulse rounded bg-muted md:h-5"
      />
    );
  }
  // idle or error: fall back to the name from the petitions payload
  return fallback ? (
    <p className="text-base text-muted-foreground">{fallback}</p>
  ) : null;
}

function MPContactBlock({ mp }: { mp: ReturnType<typeof useMP> }) {
  if (mp.status === "loading") {
    return (
      <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3">
        <span aria-hidden className="h-4 w-32 animate-pulse rounded bg-muted" />
        <span aria-hidden className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (mp.status !== "ready") return null;

  const { email, phone, website, twitter, parliamentUrl } = mp.data;
  const hasContact = email || phone || website || twitter;

  return (
    <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3 text-base">
      <ContactLink
        href={parliamentUrl}
        external
        icon={<ExternalLink aria-hidden size={14} />}
      >
        View on parliament.uk
      </ContactLink>
      {email && (
        <ContactLink
          href={`mailto:${email}`}
          icon={<Mail aria-hidden size={14} />}
        >
          {email}
        </ContactLink>
      )}
      {phone && (
        <ContactLink
          href={`tel:${phone.replace(/\s+/g, "")}`}
          icon={<Phone aria-hidden size={14} />}
        >
          {phone}
        </ContactLink>
      )}
      {website && (
        <ContactLink
          href={website}
          external
          icon={<Globe aria-hidden size={14} />}
        >
          {prettyHost(website)}
        </ContactLink>
      )}
      {twitter && (
        <ContactLink
          href={twitter}
          external
          icon={<MessageCircle aria-hidden size={14} />}
        >
          {prettyHandle(twitter)}
        </ContactLink>
      )}
      {!hasContact && (
        <p className="text-base text-muted-foreground">
          No public contact details published.
        </p>
      )}
    </div>
  );
}

function ContactLink({
  href,
  external,
  icon,
  children,
}: {
  href: string;
  external?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 break-all text-foreground underline decoration-muted-foreground/40 underline-offset-2",
        "hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span aria-hidden className="text-muted-foreground">
        {icon}
      </span>
      <span>{children}</span>
    </a>
  );
}

function prettyHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function prettyHandle(url: string): string {
  try {
    const u = new URL(url);
    const segment = u.pathname.split("/").filter(Boolean)[0];
    return segment ? `@${segment}` : u.host;
  } catch {
    return url;
  }
}
