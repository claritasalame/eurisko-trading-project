"use client";

import { useCallback, useEffect, useState } from "react";
import { getNewsArticles, NewsArticleResponse } from "@/lib/api";

const NEWS_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const RELATIVE_TIME_INTERVAL_MS = 60 * 1000;

function relativeTime(value: string, now: number) {
  const minutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

export function NewsFeed({ symbol = "AAPL" }: { symbol?: string }) {
  const [items, setItems] = useState<NewsArticleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const loadNews = useCallback(async () => {
    try {
      setItems(await getNewsArticles(symbol));
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    setIsLoading(true);
    void loadNews();
    const newsTimer = window.setInterval(() => void loadNews(), NEWS_REFRESH_INTERVAL_MS);
    const clockTimer = window.setInterval(() => setNow(Date.now()), RELATIVE_TIME_INTERVAL_MS);
    return () => {
      window.clearInterval(newsTimer);
      window.clearInterval(clockTimer);
    };
  }, [loadNews]);

  if (isLoading) {
    return (
      <section className="panel mt-4 p-4">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">NEWS FEED</h2></div>
        <div className="flex gap-3 overflow-hidden">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton-card min-w-[260px] rounded-xl" />)}</div>
      </section>
    );
  }

  return (
    <section className="panel mt-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">NEWS FEED</h2>
        <span className="text-xs text-[var(--text-muted)]">{symbol}</span>
      </div>
      {hasError ? (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] px-4 py-8 text-center">
          <p className="text-sm text-[var(--text-primary)]">Couldn&apos;t load news for {symbol}. Try again.</p>
          <button type="button" onClick={() => void loadNews()} className="focus-visible-ring mt-4 rounded-lg border border-[var(--accent-signal)] px-3 py-2 text-sm text-[var(--accent-signal)]">Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] px-4 py-8 text-sm text-[var(--text-muted)]">No recent news for this symbol.</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="focus-visible-ring block min-w-[260px] rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 transition hover:border-[var(--accent-signal)]/50">
              <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]"><span>{item.source}</span><span className="font-[family-name:var(--font-data)]">{relativeTime(item.publishedAt, now)}</span></div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-primary)]">{item.headline}</p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
