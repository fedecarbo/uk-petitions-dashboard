"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { parsePetitionId } from "@/lib/parse-petition-id";

export const PETITION_SEARCH_INPUT_ID = "petition-search";

export function PetitionSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = parsePetitionId(value);
    if (!id) {
      setError("Enter a numeric petition ID or a petition.parliament.uk URL");
      return;
    }
    setError(null);
    router.push(`/p/${id}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="border-b border-border">
        <Input
          id={PETITION_SEARCH_INPUT_ID}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="petition ID or URL"
          aria-label="Petition ID or URL"
          autoFocus
          inputMode="text"
          className="h-auto w-full rounded-none border-0 bg-transparent px-0 py-3 text-2xl font-semibold shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0 md:py-4 md:text-3xl lg:py-6 lg:text-4xl xl:text-5xl dark:bg-transparent"
        />
      </form>
      {error && (
        <p
          className="text-sm text-destructive md:text-base"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
