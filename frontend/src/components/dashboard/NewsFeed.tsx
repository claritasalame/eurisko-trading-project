"use client";

import { useEffect, useState } from "react";
import { getNewsArticles } from "@/lib/api";

const newsSeed = [
  {
    id: "1",
    source: "Reuters",
    headline: "Chipmakers extend gains after AI server demand outlook improves.",
    publishedAt: "3m ago",
  },
  {
    id: "2",
    source: "Bloomberg",
    headline: "Treasury yields soften as traders brace for a slower inflation print.",
    publishedAt: "12m ago",
  },
  {
    id: "3",
    source: "CNBC",
    headline: "Analysts highlight consumer demand resilience across large-cap software names.",
    publishedAt: "21m ago",
  },
];

export function NewsFeed({ symbol = "AAPL" }: { symbol?: string }) {
  const [items, setItems] = useState(newsSeed);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await getNewsArticles(symbol).catch(() => newsSeed);
        setItems(response);
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
  }, [symbol]);

  if (isLoading) {
    return (
      <section className="panel mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
            NEWS FEED
          </h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-card min-w-[260px] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="panel mt-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
          NEWS FEED
        </h2>
        <span className="text-xs text-[var(--text-muted)]">{symbol}</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] px-4 py-8 text-sm text-[var(--text-muted)]">
          No recent news for this symbol.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <article
              key={item.id}
              className="min-w-[260px] rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <span>{item.source}</span>
                <span className="font-[family-name:var(--font-data)]">{item.publishedAt}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">{item.headline}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
