const newsSeed = [
  {
    id: "1",
    source: "Reuters",
    headline: "Chipmakers extend gains after AI infrastructure spending outlook improves.",
    publishedAt: "3m ago",
    sentiment: "Positive",
  },
  {
    id: "2",
    source: "Bloomberg",
    headline: "Treasury yields ease as traders weigh a softer inflation report and rate path risk.",
    publishedAt: "11m ago",
    sentiment: "Neutral",
  },
  {
    id: "3",
    source: "CNBC",
    headline: "Software leaders attract fresh demand as enterprise AI budgets stay firm.",
    publishedAt: "19m ago",
    sentiment: "Positive",
  },
  {
    id: "4",
    source: "Financial Times",
    headline: "Energy shares pull back as crude oil traders trim upside after a sharp rally.",
    publishedAt: "24m ago",
    sentiment: "Negative",
  },
  {
    id: "5",
    source: "MarketWatch",
    headline: "Semiconductor names stay in focus ahead of next week’s earnings cycle.",
    publishedAt: "38m ago",
    sentiment: "Positive",
  },
  {
    id: "6",
    source: "WSJ",
    headline: "Consumer discretionary firms show resilience as retail spending remains stable.",
    publishedAt: "52m ago",
    sentiment: "Neutral",
  },
];

function sentimentClass(sentiment: string) {
  if (sentiment === "Positive") {
    return "border border-[rgba(52,211,153,0.35)] bg-[rgba(52,211,153,0.12)] text-[var(--positive)]";
  }
  if (sentiment === "Negative") {
    return "border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] text-[var(--negative)]";
  }
  return "border border-[var(--border-hairline)] bg-[var(--neutral-badge-bg)] text-[var(--text-primary)]";
}

export function NewsAggregator() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Market news
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Aggregated from multiple financial sources
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {newsSeed.map((item) => (
          <article
            key={item.id}
            className="min-h-[180px] rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition-colors hover:bg-[var(--bg-surface-hover)]"
          >
            <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
              <span>{item.source}</span>
              <span className="font-[family-name:var(--font-data)]">{item.publishedAt}</span>
            </div>

            <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--text-primary)]">{item.headline}</p>

            <div className="mt-4">
              <span className={`rounded-full px-2.5 py-1 text-[11px] ${sentimentClass(item.sentiment)}`}>
                {item.sentiment}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
