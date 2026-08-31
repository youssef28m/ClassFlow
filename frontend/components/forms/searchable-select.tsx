"use client";

import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export interface SearchableSelectOption {
  value: string | number;
  label: string;
  hint?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  /** Fired (debounced) as the user types so parents can server-side search. */
  onSearch?: (query: string) => void;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results",
  loading = false,
  disabled = false,
  className,
  onSearch,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim());
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressSearchRef = useRef(false);

  const selected = useMemo(
    () => options.find((o) => String(o.value) === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!debouncedQuery) return options;
    const q = debouncedQuery.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint && o.hint.toLowerCase().includes(q)),
    );
  }, [options, debouncedQuery]);

  useEffect(() => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      return;
    }
    onSearch?.(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue === value ? "" : optionValue);
      setOpen(false);
      setQuery("");
      suppressSearchRef.current = true;
    },
    [onChange, value],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm text-left outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <span
          className={`truncate ${selected ? "text-card-foreground" : "text-muted-foreground/60"}`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 w-full bg-transparent text-sm text-card-foreground outline-none placeholder:text-muted-foreground/60"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-card-foreground"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>

          <div
            role="listbox"
            className="scroll-slim max-h-60 overflow-y-auto p-1"
          >
            {loading ? (
              <p className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading…
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              filtered.map((option) => {
                const isSelected = String(option.value) === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(String(option.value))}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm transition-colors ${
                      isSelected
                        ? "bg-primary/15 text-primary"
                        : "text-card-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="truncate font-medium">{option.label}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {option.hint ? (
                        <span className="text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      ) : null}
                      {isSelected ? (
                        <Check className="size-4 text-primary" aria-hidden />
                      ) : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
