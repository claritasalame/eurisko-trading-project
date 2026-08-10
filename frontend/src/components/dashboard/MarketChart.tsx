"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getQuote } from "@/lib/api";
import { formatChartValue, formatPercent, formatPrice, isFiniteNumber } from "@/lib/numbers";

const chartSeed = [
  { time: "09:30", price: 209.6 },
  { time: "10:00", price: 210.2 },
  { time: "10:30", price: 208.9 },
  { time: "11:00", price: 212.1 },
  { time: "11:30", price: 211.5 },
  { time: "12:00", price: 214.2 },
  { time: "12:30", price: 213.4 },
  { time: "13:00", price: 215.1 },
  { time: "13:30", price: 217.8 },
];

const timeframes = ["1D", "1W", "1M", "1Y"] as const;
const indicators = ["RSI", "MACD", "SMA"] as const;

type MarketChartProps = {
  symbol?: string;
};

export function MarketChart({ symbol = "AAPL" }: MarketChartProps) {
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("1D");
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [data, setData] = useState(chartSeed);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [dayChangePercent, setDayChangePercent] = useState<number | null>(null);

  useEffect(() => {
    const loadChart = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const quote = await getQuote(symbol);
        if (!isFiniteNumber(quote.price) || !isFiniteNumber(quote.day_change_percent)) {
          throw new Error("Quote response contains invalid numeric values");
        }

        setCurrentPrice(quote.price);
        setDayChangePercent(quote.day_change_percent);
        const priceDelta = quote.price * (quote.day_change_percent / 100);
        const nextData = chartSeed.map((point, index) => ({
          time: point.time,
          price: Number((quote.price + priceDelta * (index / 5 - 0.5)).toFixed(2)),
        }));

        setData(nextData);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadChart();
  }, [symbol]);

  const formattedPrice = useMemo(() => formatPrice(currentPrice), [currentPrice]);

  if (isLoading) {
    return (
      <section className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
            MARKET CHART
          </h2>
          <span className="font-[family-name:var(--font-data)] text-xs text-[var(--text-muted)]">
            {symbol}
          </span>
        </div>
        <div className="skeleton-chart rounded-xl" />
      </section>
    );
  }

  if (hasError) {
    return (
      <section className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
            MARKET CHART
          </h2>
        </div>
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] px-4 py-8 text-center">
          <p className="text-sm text-[var(--text-primary)]">
            Couldn&apos;t load price data for {symbol}. Try again.
          </p>
          <button
            type="button"
            className="focus-visible-ring mt-4 rounded-lg border border-[var(--accent-signal)] px-3 py-2 text-sm text-[var(--accent-signal)]"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
            MARKET CHART
          </h2>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-data)] text-xl text-[var(--text-primary)]">
              {formattedPrice}
            </span>
            <span className={`font-[family-name:var(--font-data)] text-sm ${isFiniteNumber(dayChangePercent) && dayChangePercent < 0 ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}>
              {isFiniteNumber(dayChangePercent) && dayChangePercent > 0 ? "+" : ""}{formatPercent(dayChangePercent)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {timeframes.map((option) => (
            <button
              key={option}
              type="button"
              className={`focus-visible-ring rounded-full border px-3 py-1 text-xs ${
                timeframe === option
                  ? "border-[var(--accent-signal)] bg-[var(--accent-signal)]/10 text-[var(--accent-signal)]"
                  : "border-[var(--border-hairline)] text-[var(--text-muted)]"
              }`}
              onClick={() => setTimeframe(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {indicators.map((indicator) => {
          const isActive = selectedIndicators.includes(indicator);
          return (
            <button
              key={indicator}
              type="button"
              className={`focus-visible-ring rounded-full border px-3 py-1 text-xs ${
                isActive
                  ? "border-[var(--accent-signal)] text-[var(--accent-signal)]"
                  : "border-[var(--border-hairline)] text-[var(--text-muted)]"
              }`}
              onClick={() => {
                setSelectedIndicators((current) =>
                  current.includes(indicator)
                    ? current.filter((item) => item !== indicator)
                    : [...current, indicator],
                );
              }}
            >
              {indicator}
            </button>
          );
        })}
      </div>

      <div className="h-[280px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="rgba(124,132,148,0.12)" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#7C8494", fontFamily: "var(--font-data)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#7C8494", fontFamily: "var(--font-data)" }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 4", "dataMax + 4"]}
            />
            <Tooltip
              formatter={(value) => [formatChartValue(value), "Price"]}
              labelFormatter={(label) => String(label ?? "")}
              contentStyle={{
                background: "#12161F",
                border: "1px solid #262C3B",
                borderRadius: 12,
                fontFamily: "var(--font-data)",
              }}
              labelStyle={{ color: "#E8EAF0" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#4FD1C5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
