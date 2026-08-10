"use client";

import { useMemo, useState } from "react";
import { AccountMenu } from "@/components/auth/AccountMenu";

const suggestions = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META"];

export function TopBar() {
  const [query, setQuery] = useState("AAPL");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const nextQuery = query.trim().toUpperCase();
    if (!nextQuery) return suggestions;

    return suggestions.filter((item) => item.includes(nextQuery));
  }, [query]);

  return (
    <header className="panel sticky top-0 z-30 flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="flex min-w-fit items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--accent-signal)]/50 bg-[var(--bg-surface-raised)] text-sm font-semibold text-[var(--accent-signal)]">
          M
        </div>
        <div>
          <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.18em] text-[var(--text-primary)]">
            MARKETMIND
          </p>
        </div>
      </div>

      <div className="relative flex-1 min-w-[260px]">
        <label className="sr-only" htmlFor="ticker-search">
          Search ticker
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] px-3 py-2">
          <span className="text-[var(--text-muted)]">⌕</span>
          <input
            id="ticker-search"
            className="w-full bg-transparent font-[family-name:var(--font-data)] text-sm text-[var(--text-primary)] outline-none"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => window.setTimeout(() => setShowSuggestions(false), 100)}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
            }}
            placeholder="Search ticker"
          />
        </div>

        {showSuggestions && filteredSuggestions.length > 0 ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1 shadow-2xl">
            {filteredSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="focus-visible-ring flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(item);
                  setShowSuggestions(false);
                }}
              >
                <span className="font-[family-name:var(--font-data)]">{item}</span>
                <span className="text-[var(--text-muted)]">Add to watchlist</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <AccountMenu className="ml-auto" />
    </header>
  );
}
