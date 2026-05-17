"use client";

import { useEffect, useState } from "react";
import { fetchMP, type MPContact } from "@/lib/mp-api";

export type MPState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: MPContact }
  | { status: "error"; message: string };

// Cached lookups expire after 15 min, prompting a re-check the *next* time the
// constituency is selected. Stale entries are still rendered (not replaced with
// "loading") so an idle kiosk doesn't flash.
const TTL_MS = 15 * 60_000;

type Cached<T> = { value: T; expires: number };

const cache = new Map<string, Cached<MPContact>>();
const errors = new Map<string, Cached<string>>();

function isFresh(entry: { expires: number } | undefined): boolean {
  return entry !== undefined && entry.expires > Date.now();
}

export function useMP(constituencyName: string | null): MPState {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!constituencyName) return;
    const key = constituencyName.toLowerCase();
    if (isFresh(cache.get(key)) || isFresh(errors.get(key))) return;

    let cancelled = false;
    fetchMP(constituencyName)
      .then((data) => {
        if (cancelled) return;
        cache.set(key, { value: data, expires: Date.now() + TTL_MS });
        errors.delete(key);
        setVersion((v) => v + 1);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.set(key, { value: message, expires: Date.now() + TTL_MS });
        cache.delete(key);
        setVersion((v) => v + 1);
      });

    return () => {
      cancelled = true;
    };
  }, [constituencyName]);

  if (!constituencyName) return { status: "idle" };
  const key = constituencyName.toLowerCase();
  const cached = cache.get(key);
  if (cached) return { status: "ready", data: cached.value };
  const error = errors.get(key);
  if (error) return { status: "error", message: error.value };
  return { status: "loading" };
}
