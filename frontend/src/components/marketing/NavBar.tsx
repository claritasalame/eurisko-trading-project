"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function NavBar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-hairline)] bg-[color:rgba(10,14,23,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--accent-teal),var(--accent-violet))] p-[1px] shadow-[0_0_20px_rgba(56,189,248,0.22)]">
            <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[var(--bg-base)] text-sm font-black text-[var(--accent-teal)]">
              E
            </div>
          </div>
          <span className="font-[family-name:var(--font-display)] text-sm tracking-[0.18em] text-[var(--text-primary)]">
            Eurisko
          </span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {[
            "Features",
            "How it works",
            "Preview",
            "Trust",
          ].map((item) => (
            <Link
              key={item}
              href="#"
              className="focus-visible-ring rounded-full px-2 py-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              {item}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={user ? "/dashboard/profile" : "/login"}
            className="focus-visible-ring rounded-full px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            {user ? user.email : "Sign in"}
          </Link>
          <Link
            href={user ? "/dashboard" : "/register"}
            className="focus-visible-ring inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent-teal),var(--accent-violet))] px-4 py-2 text-sm font-semibold text-[var(--bg-base)] shadow-[0_12px_30px_rgba(56,189,248,0.22)]"
          >
            <span>Start exploring</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
