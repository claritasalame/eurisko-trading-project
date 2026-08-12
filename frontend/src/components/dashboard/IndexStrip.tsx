"use client";

import { useCallback, useEffect, useState } from "react";
import { getIndices, IndexQuoteResponse } from "@/lib/api";
import { formatPercent, isFiniteNumber } from "@/lib/numbers";

export function IndexStrip() {
  const [items, setItems] = useState<IndexQuoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadIndices = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      setItems(await getIndices());
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIndices();
  }, [loadIndices]);

  return (
    <section id="preview" className="scroll-mt-20 mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-card rounded-2xl" />)}</div>
      ) : hasError ? (
        <div className="panel p-6 text-center">
          <p className="text-sm text-[var(--text-primary)]">Couldn&apos;t load market indices. Try again.</p>
          <button type="button" onClick={() => void loadIndices()} className="focus-visible-ring mt-4 rounded-lg border border-[var(--accent-signal)] px-3 py-2 text-sm text-[var(--accent-signal)]">Retry</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const positive = isFiniteNumber(item.day_change_percent) && item.day_change_percent >= 0;
            return (
              <article key={item.symbol} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{item.label}</span>
                <p className="mt-4 font-[family-name:var(--font-data)] text-2xl font-semibold">{item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p className={`mt-3 font-[family-name:var(--font-data)] text-sm ${positive ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{positive ? "▲ " : "▼ "}{formatPercent(item.day_change_percent)}</p>
                <p className="mt-4 text-[10px] text-[var(--text-muted)]">Yahoo Finance · {item.symbol}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
