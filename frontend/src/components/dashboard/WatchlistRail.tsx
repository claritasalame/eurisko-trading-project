"use client";

import { useCallback, useEffect, useState } from "react";
import { getQuote, getStocks } from "@/lib/api";
import { formatPercent, formatPrice, isFiniteNumber } from "@/lib/numbers";

type WatchlistItem = {
  symbol: string;
  company: string;
  price: number | null;
  day_change_percent: number | null;
};

type WatchlistRailProps = {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
};

export function WatchlistRail({ selectedSymbol, onSelectSymbol }: WatchlistRailProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadWatchlist = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const stocks = await getStocks();
      const quoteResults = await Promise.allSettled(
        stocks.map(async (item) => {
          const response = await getQuote(item.symbol);
          return {
            symbol: item.symbol,
            company: item.name ?? item.symbol,
            price: response.price,
            day_change_percent: response.day_change_percent,
          };
        }),
      );

      const quotes = quoteResults.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        }

        const stock = stocks[index];
        return {
          symbol: stock.symbol,
          company: stock.name ?? stock.symbol,
          price: null,
          day_change_percent: null,
        };
      });

      setWatchlist(quotes);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWatchlist();
  }, [loadWatchlist]);

  if (isLoading) {
    return (
      <aside className="panel h-fit p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
            WATCHLIST
          </h2>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton-row rounded-lg" />
          ))}
        </div>
      </aside>
    );
  }

  if (hasError) {
    return (
      <aside className="panel h-fit p-3">
        <p className="text-sm text-[var(--text-muted)]">Couldn&apos;t load quotes right now. Try again.</p>
        <button type="button" onClick={() => void loadWatchlist()} className="focus-visible-ring mt-3 rounded-lg border border-[var(--accent-signal)] px-3 py-2 text-sm text-[var(--accent-signal)]">Retry</button>
      </aside>
    );
  }

  return (
    <aside className="panel h-fit p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
          WATCHLIST
        </h2>
        <span className="text-[var(--text-muted)]">{watchlist.length}</span>
      </div>

      {watchlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          <div className="mb-2 text-lg">⌕</div>
          No symbols yet. Search above to add one.
        </div>
      ) : (
        <div className="space-y-1">
          {watchlist.map((item) => {
            const priceValue = item.price ?? 0;
            const changeValue = item.day_change_percent ?? 0;
            const hasChange = isFiniteNumber(changeValue);
            const positive = hasChange && changeValue >= 0;
            const isSelected = item.symbol === selectedSymbol;
            const isUnavailable = item.price === null || item.day_change_percent === null;

            return (
              <button
                key={item.symbol}
                type="button"
                onClick={() => onSelectSymbol(item.symbol)}
                className={`focus-visible-ring flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--bg-surface-raised)] ${isSelected ? "border border-[var(--accent-signal)]/30 bg-[var(--bg-surface-raised)]" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-[family-name:var(--font-data)] text-sm text-[var(--text-primary)]">
                      {item.symbol}
                    </span>
                    <span className="font-[family-name:var(--font-data)] text-xs text-[var(--text-muted)]">
                      {isUnavailable ? "—" : formatPrice(priceValue)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate text-[var(--text-muted)]">{item.company}</span>
                    {isUnavailable ? (
                      <span className="text-[var(--text-muted)]">Unavailable</span>
                    ) : (
                      <span className={positive ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
                        {hasChange ? <span className="mr-1">{positive ? "▲" : "▼"}</span> : null}
                        {formatPercent(changeValue)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
