"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { parsePetitionId } from "@/lib/parse-petition-id";

const EXAMPLE_ID = "746363";

export function PetitionSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(raw: string) {
    const id = parsePetitionId(raw);
    if (!id) {
      setError("Enter a numeric petition ID or a petition.parliament.uk URL");
      return;
    }
    setError(null);
    router.push(`/p/${id}`);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit(value);
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <form onSubmit={handleSubmit} className="w-full">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Petition ID or URL"
          aria-label="Petition ID or URL"
          autoFocus
          inputMode="text"
          className="h-16 w-full rounded-2xl border-2 px-6 text-xl font-semibold shadow-sm md:h-20 md:text-2xl"
        />
      </form>

      <p
        className="text-sm text-muted-foreground md:text-base"
        aria-live="polite"
      >
        {error ?? (
          <>
            Try{" "}
            <button
              type="button"
              onClick={() => {
                setValue(EXAMPLE_ID);
                submit(EXAMPLE_ID);
              }}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              petition #{EXAMPLE_ID}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
