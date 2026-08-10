"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function Hero() {
  const { user } = useAuth();
  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-10 pt-16 text-center sm:px-6 lg:px-8 lg:pt-20">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[rgba(16,20,31,0.9)] px-3 py-1 text-xs text-[var(--text-muted)] shadow-[0_10px_30px_rgba(7,10,17,0.4)]">
        <span className="text-[var(--accent-teal)]">✦</span>
        <span>AI-powered market intelligence</span>
      </div>

      <h1 className="mt-6 max-w-4xl font-[family-name:var(--font-display)] text-4xl font-bold leading-[0.95] tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl lg:text-7xl">
        <span className="block">Know what the market is doing</span>
        <span className="block bg-[linear-gradient(135deg,var(--accent-teal),var(--accent-violet))] bg-clip-text text-transparent">
          before you make your next trade.
        </span>
      </h1>

      <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
        AI-driven insight, live market signals, and fast-moving news review in one clear workspace built for active investors.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={user ? "/dashboard" : "/register"}
          className="focus-visible-ring inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent-teal),var(--accent-violet))] px-5 py-3 text-sm font-semibold text-[var(--bg-base)] shadow-[0_12px_30px_rgba(56,189,248,0.22)]"
        >
          <span>Start exploring</span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          href="#preview"
          className="focus-visible-ring rounded-full border border-[var(--border-hairline)] bg-transparent px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
        >
          See live preview
        </Link>
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        No credit card required · Built for active investors
      </p>
    </section>
  );
}
