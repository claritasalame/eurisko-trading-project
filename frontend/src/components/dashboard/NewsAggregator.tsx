"use client";

import { useCallback, useEffect, useState } from "react";
import { getLatestNews, NewsArticleResponse } from "@/lib/api";

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export function NewsAggregator() {
  const [items, setItems] = useState<NewsArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      setItems(await getLatestNews(6));
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <h2 className="text-3xl font-bold">Latest market news</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Recent articles stored by the live ingestion pipeline</p>
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton-card rounded-2xl" />)}
        </div>
      ) : hasError ? (
        <div className="panel p-6 text-center">
          <p className="text-sm text-[var(--text-primary)]">Couldn&apos;t load market news. Try again.</p>
          <button type="button" onClick={() => void loadNews()} className="focus-visible-ring mt-4 rounded-lg border border-[var(--accent-signal)] px-3 py-2 text-sm text-[var(--accent-signal)]">Retry</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="focus-visible-ring min-h-[150px] rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 hover:border-[var(--accent-signal)]/50">
              <div className="flex justify-between gap-3 text-[11px] text-[var(--text-muted)]"><span>{item.source}</span><span>{relativeTime(item.publishedAt)}</span></div>
              <p className="mt-4 line-clamp-3 text-sm leading-6">{item.headline}</p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
