"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConstituencyOption {
  code: string;
  name: string;
  mp: string | null;
}

interface ConstituencySearchProps {
  constituencies: ConstituencyOption[];
  onSelect: (code: string) => void;
}

const MAX_RESULTS = 8;

export function ConstituencySearch({
  constituencies,
  onSelect,
}: ConstituencySearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const matches = useMemo<ConstituencyOption[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const startsWith: ConstituencyOption[] = [];
    const contains: ConstituencyOption[] = [];
    for (const c of constituencies) {
      const n = c.name.toLowerCase();
      if (n.startsWith(q)) startsWith.push(c);
      else if (n.includes(q)) contains.push(c);
    }
    return [...startsWith, ...contains].slice(0, MAX_RESULTS);
  }, [query, constituencies]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function commit(option: ConstituencyOption) {
    onSelect(option.code);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function clear() {
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (query) {
        clear();
      } else {
        inputRef.current?.blur();
      }
      return;
    }
    if (!open || matches.length === 0) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % matches.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
        break;
      case "Enter":
        event.preventDefault();
        commit(matches[activeIndex]);
        break;
    }
  }

  const showList = open && matches.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
          <Search aria-hidden className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Find a constituency…"
          aria-label="Find a constituency"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? listboxId : undefined}
          aria-activedescendant={
            showList ? `${listboxId}-option-${activeIndex}` : undefined
          }
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => {
            if (query) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md border border-border bg-card py-2 pr-9 pl-9 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring lg:py-2.5 lg:text-base"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={clear}
            className="absolute inset-y-0 right-1 flex items-center justify-center rounded-sm px-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && query && matches.length === 0 && (
        <p className="absolute top-full right-0 left-0 z-10 mt-1 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-md lg:text-sm">
          No constituency matches “{query}”.
        </p>
      )}

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-card shadow-md"
        >
          {matches.map((m, i) => (
            <li
              key={m.code}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onPointerDown={(e) => {
                e.preventDefault();
                commit(m);
              }}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm",
                i === activeIndex
                  ? "bg-muted text-foreground"
                  : "text-foreground hover:bg-muted/60",
              )}
            >
              <div className="truncate font-medium">{m.name}</div>
              {m.mp && (
                <div className="truncate text-xs text-muted-foreground">
                  {m.mp}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
