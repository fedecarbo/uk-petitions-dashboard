"use client";

import { useEffect, useState } from "react";
import { fetchMP, type MPContact } from "@/lib/mp-api";

export type MPState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: MPContact }
  | { status: "error"; message: string };

// Module-level client cache. Re-selecting a previously-viewed constituency
// resolves synchronously without a network round-trip.
const cache = new Map<string, MPContact>();
const errors = new Map<string, string>();

export function useMP(constituencyName: string | null): MPState {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!constituencyName) return;
    const key = constituencyName.toLowerCase();
    if (cache.has(key) || errors.has(key)) return;

    let cancelled = false;
    fetchMP(constituencyName)
      .then((data) => {
        if (cancelled) return;
        cache.set(key, data);
        setVersion((v) => v + 1);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.set(key, message);
        setVersion((v) => v + 1);
      });

    return () => {
      cancelled = true;
    };
  }, [constituencyName]);

  if (!constituencyName) return { status: "idle" };
  const key = constituencyName.toLowerCase();
  const cached = cache.get(key);
  if (cached) return { status: "ready", data: cached };
  const error = errors.get(key);
  if (error) return { status: "error", message: error };
  return { status: "loading" };
}
