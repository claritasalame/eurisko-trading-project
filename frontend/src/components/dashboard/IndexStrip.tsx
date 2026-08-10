"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartValue, formatPercent, isFiniteNumber } from "@/lib/numbers";

const indexCards = [
  {
    label: "S&P 500",
    value: 5834.27,
    change: 1.14,
    sentiment: "Bullish",
    data: [5791, 5804, 5810, 5823, 5830, 5834],
  },
  {
    label: "Nasdaq 100",
    value: 20284.11,
    change: 1.82,
    sentiment: "Bullish",
    data: [19890, 19972, 20046, 20110, 20178, 20284],
  },
  {
    label: "Dow Jones",
    value: 42189.65,
    change: -0.34,
    sentiment: "Bearish",
    data: [42320, 42288, 42255, 42210, 42195, 42189],
  },
  {
    label: "Volatility Index",
    value: 15.22,
    change: -1.46,
    sentiment: "Neutral",
    data: [16.0, 15.9, 15.7, 15.5, 15.3, 15.22],
  },
] as const;

function badgeClass(sentiment: string) {
  if (sentiment === "Bullish") {
    return "border border-[rgba(52,211,153,0.35)] bg-[rgba(52,211,153,0.12)] text-[var(--positive)]";
  }

  if (sentiment === "Bearish") {
    return "border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] text-[var(--negative)]";
  }

  return "border border-[var(--border-hairline)] bg-[var(--neutral-badge-bg)] text-[var(--text-primary)]";
}

export function IndexStrip() {
  return (
    <section id="preview" className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {indexCards.map((item) => {
          const isPositive = isFiniteNumber(item.change) && item.change >= 0;
          const changeColor = isPositive ? "var(--positive)" : "var(--negative)";
          const strokeColor = isPositive ? "#34D399" : "#F87171";

          return (
            <article
              key={item.label}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 shadow-[0_18px_50px_rgba(7,10,17,0.34)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {item.label}
                </span>
                <span className={`rounded-full px-2 py-1 text-[11px] ${badgeClass(item.sentiment)}`}>
                  {item.sentiment}
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-4">
                <span className="font-[family-name:var(--font-data)] text-2xl font-semibold text-[var(--text-primary)]">
                  {item.value.toLocaleString(undefined, {
                    minimumFractionDigits: item.label === "Volatility Index" ? 2 : 0,
                    maximumFractionDigits: item.label === "Volatility Index" ? 2 : 2,
                  })}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm">
                <span style={{ color: changeColor }} className="font-[family-name:var(--font-data)]">
                  {isPositive ? "▲" : "▼"}
                </span>
                <span style={{ color: changeColor }} className="font-[family-name:var(--font-data)]">
                  {formatPercent(item.change)}
                </span>
              </div>

              <div className="mt-4 h-20 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={item.data.map((point, index) => ({ value: point, label: String(index) }))}>
                    <defs>
                      <linearGradient id={`gradient-${item.label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={strokeColor} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(136,145,163,0.12)" strokeDasharray="3 3" />
                    <XAxis hide dataKey="label" />
                    <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      formatter={(value) => [formatChartValue(value), "Value"]}
                      labelFormatter={(label) => String(label ?? "")}
                      cursor={{ stroke: "rgba(136,145,163,0.3)", strokeWidth: 1 }}
                      contentStyle={{
                        background: "#10141F",
                        border: "1px solid #232838",
                        borderRadius: 12,
                        fontFamily: "var(--font-data)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={strokeColor}
                      fill={`url(#gradient-${item.label})`}
                      strokeWidth={2}
                      dot={false}
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
