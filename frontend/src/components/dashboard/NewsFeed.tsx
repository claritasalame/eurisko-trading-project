"use client";

import { useEffect, useState } from "react";
import { getNewsArticles, NewsArticleResponse } from "@/lib/api";

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

function relativeTime(value: string) {
  if (value.endsWith("ago")) return value;
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NewsFeed({ symbol = "AAPL" }: { symbol?: string }) {
  const [items, setItems] = useState<NewsArticleResponse[]>(newsSeed);
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
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="focus-visible-ring block min-w-[260px] rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 transition hover:border-[var(--accent-signal)]/50">
              <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <span>{item.source}</span>
                <span className="font-[family-name:var(--font-data)]">{relativeTime(item.publishedAt)}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-primary)]">{item.headline}</p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
