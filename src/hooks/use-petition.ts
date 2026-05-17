"use client";

import { useEffect, useState } from "react";
import type { PetitionResponse } from "@/lib/petitions-api";

const POLL_INTERVAL_MS = 60_000;
const HISTORY_MAX = 60;

export type PetitionLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PetitionResponse };

export interface PetitionHistorySample {
  t: number;
  count: number;
}

export interface PetitionHookResult {
  state: PetitionLoadState;
  lastUpdated: number | null;
  isRefreshing: boolean;
  history: PetitionHistorySample[];
}

export function usePetition(id: string): PetitionHookResult {
  const [state, setState] = useState<PetitionLoadState>({ status: "loading" });
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<PetitionHistorySample[]>([]);

  useEffect(() => {
    let cancelled = false;
    let firstLoad = true;

    async function load() {
      setIsRefreshing(true);
      try {
        const res = await fetch(`/api/petitions/${id}`, { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Request failed (${res.status})`);
        }
        const data = (await res.json()) as PetitionResponse;
        if (cancelled) return;
        const now = Date.now();
        setState({ status: "ready", data });
        setLastUpdated(now);
        const isFirst = firstLoad;
        firstLoad = false;
        setHistory((prev) => {
          const sample: PetitionHistorySample = {
            t: now,
            count: data.data.attributes.signature_count,
          };
          const base = isFirst ? [] : prev;
          const next = [...base, sample];
          return next.length > HISTORY_MAX
            ? next.slice(next.length - HISTORY_MAX)
            : next;
        });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((prev) =>
          prev.status === "ready" ? prev : { status: "error", message },
        );
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  return { state, lastUpdated, isRefreshing, history };
}
