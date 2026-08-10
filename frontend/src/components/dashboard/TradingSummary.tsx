"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPortfolioSummary, PortfolioSummaryResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatPercent, formatPrice } from "@/lib/numbers";

export function TradingSummary() {
  const { user, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<PortfolioSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) {
      setSummary(null);
      return;
    }
    setLoading(true);
    getPortfolioSummary(user.id)
      .then(setSummary)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Could not load portfolio",
        ),
      )
      .finally(() => setLoading(false));
  }, [user]);
  const topMover = useMemo(
    () =>
      summary?.holdings.reduce(
        (best, item) =>
          item.day_change_percent === null
            ? best
            : !best ||
                best.day_change_percent === null ||
                Math.abs(item.day_change_percent) >
                  Math.abs(best.day_change_percent)
            ? item
            : best,
        undefined as PortfolioSummaryResponse["holdings"][number] | undefined,
      ),
    [summary],
  );

  if (authLoading)
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="skeleton-chart rounded-2xl" />
      </section>
    );
  if (!user)
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="panel p-8 text-center">
          <h2 className="text-2xl font-bold">
            Sign in to see your real portfolio summary
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Your holdings, daily movement, and risk profile are private to your
            account.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-full bg-[var(--accent-signal)] px-5 py-2.5 text-sm font-semibold text-[var(--bg-base)]"
          >
            Sign in
          </Link>
        </div>
      </section>
    );
  if (loading)
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="skeleton-chart rounded-2xl" />
      </section>
    );
  if (error || !summary)
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="panel p-6 text-[var(--negative)]">
          {error || "Could not load portfolio."}
        </div>
      </section>
    );

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold">Your trading summary</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Live values for {user.email}
      </p>
      {summary.holdings.length === 0 ? (
        <div className="panel mt-5 p-8 text-center">
          <h3 className="text-xl font-semibold">Add your first holding</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Your real portfolio totals will appear here.
          </p>
          <Link
            href="/dashboard/profile"
            className="mt-5 inline-block rounded-full border border-[var(--accent-signal)] px-4 py-2 text-sm text-[var(--accent-signal)]"
          >
            Open profile
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Portfolio value", formatPrice(summary.portfolio_value)],
              ["Today's change", formatPrice(summary.today_change)],
              [
                "Top mover",
                topMover && topMover.day_change_percent !== null
                  ? `${topMover.symbol} ${formatPercent(topMover.day_change_percent)}`
                  : "—",
              ],
              ["Risk level", summary.risk_tolerance || "Not set"],
            ].map(([label, value]) => (
              <article key={label} className="panel p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {label}
                </p>
                <p className="mt-3 font-[family-name:var(--font-data)] text-2xl font-semibold">
                  {value}
                </p>
              </article>
            ))}
          </div>
          <div className="panel mt-5 p-4">
            <h3 className="text-sm tracking-[0.14em] text-[var(--text-muted)]">
              HOLDINGS
            </h3>
            <div className="mt-3 space-y-2">
              {summary.holdings.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] p-3"
                >
                  <div>
                    <p className="font-[family-name:var(--font-data)]">
                      {item.symbol}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {item.quantity} shares
                    </p>
                  </div>
                  <div className="text-right">
                    {item.market_value === null ||
                    item.day_change_percent === null ? (
                      <p className="text-sm text-[var(--text-muted)]">
                        Price unavailable
                      </p>
                    ) : (
                      <>
                        <p>{formatPrice(item.market_value)}</p>
                        <p
                          className={
                            item.day_change_percent >= 0
                              ? "text-[var(--positive)]"
                              : "text-[var(--negative)]"
                          }
                        >
                          {formatPercent(item.day_change_percent)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
