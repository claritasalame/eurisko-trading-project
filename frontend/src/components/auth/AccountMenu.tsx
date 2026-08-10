"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function AccountMenu({ className = "" }: { className?: string }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  if (!user) return <Link href="/login" className={`focus-visible-ring rounded-xl border border-[var(--border-hairline)] px-4 py-2 text-sm ${className}`}>Sign in</Link>;
  return <div className={`relative ${className}`}><button type="button" aria-label="Open account menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="focus-visible-ring flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-signal)] text-sm font-semibold uppercase text-[var(--bg-base)]">{user.email.slice(0, 2)}</button>{open ? <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-40 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1 shadow-2xl"><Link href="/dashboard/profile" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm">Profile</Link>{user.is_admin ? <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[var(--accent-signal)]">Admin</Link> : null}<button type="button" onClick={() => { logout(); setOpen(false); router.push("/"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--negative)]">Sign out</button></div> : null}</div>;
}
