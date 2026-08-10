"use client";

import { AccountMenu } from "@/components/auth/AccountMenu";

export function NavBar() {
  return <header className="sticky top-0 z-50 border-b border-[var(--border-hairline)] bg-[color:rgba(10,14,23,0.78)] backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--accent-teal),var(--accent-violet))] p-[1px]"><div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[var(--bg-base)] text-sm font-black text-[var(--accent-teal)]">M</div></div><span className="font-[family-name:var(--font-display)] text-sm tracking-[0.18em]">MarketMIND</span></div><nav className="hidden items-center gap-6 md:flex">{[["Features", "features"], ["How it works", "how-it-works"], ["Preview", "preview"], ["Trust", "trust"]].map(([label, id]) => <a key={id} href={`#${id}`} className="focus-visible-ring rounded-full px-2 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">{label}</a>)}</nav><AccountMenu /></div></header>;
}
