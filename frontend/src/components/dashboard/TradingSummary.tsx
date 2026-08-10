"use client";

import { useMemo } from "react";
import { formatPercent, formatPrice, isFiniteNumber } from "@/lib/numbers";

const summaryCards = [
  {
    label: "Portfolio value",
    value: "$128,420",
    tone: "neutral",
    meta: "Across 8 active positions",
  },
  {
    label: "Today's change",
    value: "+$1,840",
    tone: "positive",
    meta: "Momentum remains constructive",
  },
  {
    label: "Top mover",
    value: "NVDA +3.8%",
    tone: "positive",
    meta: "Semiconductor leadership",
  },
  {
    label: "Risk level",
    value: "Moderate",
    tone: "neutral",
    meta: "Balanced exposure",
  },
] as const;

const holdings = [
  { symbol: "AAPL", price: 214.12, changePercent: 1.42 },
  { symbol: "MSFT", price: 462.8, changePercent: -0.61 },
  { symbol: "NVDA", price: 127.24, changePercent: 2.1 },
  { symbol: "TSLA", price: 211.54, changePercent: -1.24 },
];

function statToneStyles(tone: string) {
  if (tone === "positive") {
    return {
      border: "border-[rgba(52,211,153,0.35)]",
      text: "text-[var(--positive)]",
      bg: "bg-[rgba(52,211,153,0.12)]",
    };
  }
  return {
    border: "border-[var(--border-hairline)]",
    text: "text-[var(--text-primary)]",
    bg: "bg-[var(--bg-surface)]",
  };
}

export function TradingSummary() {
  const total = useMemo(() => holdings.length, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Your trading summary
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">A quick read on where things stand</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const styles = statToneStyles(card.tone);
          return (
            <article
              key={card.label}
              className={`rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-[0_18px_50px_rgba(7,10,17,0.34)]`}
            >
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{card.label}</p>
              <p className="mt-3 font-[family-name:var(--font-data)] text-2xl font-semibold text-[var(--text-primary)]">
                {card.value}
              </p>
              <p className={`mt-2 text-xs ${styles.text}`}>{card.meta}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
            HOLDINGS
          </h3>
          <span className="font-[family-name:var(--font-data)] text-xs text-[var(--text-muted)]">
            {total} symbols
          </span>
        </div>

        <div className="space-y-2">
          {holdings.map((item) => {
            const hasChange = isFiniteNumber(item.changePercent);
            const positive = hasChange && item.changePercent >= 0;
            return (
              <div
                key={item.symbol}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] px-3 py-2"
              >
                <div>
                  <div className="font-[family-name:var(--font-data)] text-sm text-[var(--text-primary)]">
                    {item.symbol}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">Active position</div>
                </div>

                <div className="text-right">
                  <div className="font-[family-name:var(--font-data)] text-sm text-[var(--text-primary)]">
                    {formatPrice(item.price)}
                  </div>
                  <div className={`mt-1 text-xs ${positive ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                    {hasChange ? <span className="mr-1">{positive ? "▲" : "▼"}</span> : null}
                    {formatPercent(item.changePercent)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
