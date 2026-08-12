"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  addHolding,
  deleteHolding,
  getHoldings,
  getProfile,
  HoldingResponse,
  updateProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/numbers";

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id ?? "";
  const [cashBalance, setCashBalance] = useState("0");
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [investmentGoals, setInvestmentGoals] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [holdings, setHoldings] = useState<HoldingResponse[]>([]);
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (isAuthLoading || !user) {
      if (!isAuthLoading) setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [profile, currentHoldings] = await Promise.all([
          getProfile(user.id),
          getHoldings(user.id),
        ]);
        setCashBalance(String(profile.cash_balance));
        setRiskTolerance(profile.risk_tolerance ?? "moderate");
        setInvestmentGoals(profile.investment_goals ?? "");
        setExperienceLevel(profile.experience_level ?? "beginner");
        setHoldings(currentHoldings);
      } catch {
        setStatus("Could not load your profile. Try again.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [isAuthLoading, user, reloadCount]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    setIsSaving(true);
    setStatus("");
    try {
      await updateProfile(userId, {
        cash_balance: Number(cashBalance),
        risk_tolerance: riskTolerance,
        investment_goals: investmentGoals,
        experience_level: experienceLevel,
      });
      setStatus("Profile saved.");
    } catch {
      setStatus("Could not save your profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const submitHolding = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    try {
      const holding = await addHolding(userId, {
        symbol,
        quantity: Number(quantity),
        average_cost_basis: Number(costBasis),
      });
      setHoldings((current) => [...current, holding]);
      setSymbol("");
      setQuantity("");
      setCostBasis("");
      setStatus("Holding added.");
    } catch {
      setStatus("Could not add that holding. Try again.");
    }
  };

  const removeHolding = async (holdingId: string) => {
    if (!userId) return;
    try {
      await deleteHolding(userId, holdingId);
      setHoldings((current) => current.filter((holding) => holding.id !== holdingId));
      setStatus("Holding removed.");
    } catch {
      setStatus("Could not remove that holding. Try again.");
    }
  };

  const inputClass = "focus-visible-ring w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)]";

  if (!isAuthLoading && !user) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-6 text-[var(--text-primary)]"><div className="panel max-w-md p-8 text-center"><h1 className="text-2xl font-semibold">Sign in to view your profile</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Your investor profile and holdings are private to your account.</p><Link href="/login" className="focus-visible-ring mt-5 inline-block rounded-lg bg-[var(--accent-signal)] px-4 py-2 text-sm font-semibold text-[var(--bg-base)]">Sign in</Link></div></main>;
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] p-4 text-[var(--text-primary)] lg:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xs tracking-[0.18em] text-[var(--accent-signal)]">MARKETMIND</p>
            <h1 className="mt-1 text-2xl font-semibold">Profile &amp; holdings</h1>
          </div>
          <Link href="/dashboard" className="focus-visible-ring rounded-lg border border-[var(--border-hairline)] px-3 py-2 text-sm text-[var(--text-muted)]">Back to dashboard</Link>
        </div>

        {isLoading ? <div className="skeleton-chart rounded-xl" /> : (
          <div className="grid gap-4 lg:grid-cols-2">
            <form onSubmit={saveProfile} className="panel space-y-4 p-4">
              <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">INVESTOR PROFILE</h2>
              <label className="block text-sm">Cash balance<input type="number" min="0" step="0.01" value={cashBalance} onChange={(event) => setCashBalance(event.target.value)} className={`${inputClass} mt-1 font-[family-name:var(--font-data)]`} required /></label>
              <label className="block text-sm">Risk tolerance<select value={riskTolerance} onChange={(event) => setRiskTolerance(event.target.value as typeof riskTolerance)} className={`${inputClass} mt-1`}><option value="conservative">Conservative</option><option value="moderate">Moderate</option><option value="aggressive">Aggressive</option></select></label>
              <label className="block text-sm">Investment goals<input value={investmentGoals} onChange={(event) => setInvestmentGoals(event.target.value)} className={`${inputClass} mt-1`} required /></label>
              <label className="block text-sm">Experience level<select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value as typeof experienceLevel)} className={`${inputClass} mt-1`}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
              <button type="submit" disabled={isSaving} className="focus-visible-ring rounded-lg bg-[var(--accent-signal)] px-4 py-2 text-sm font-bold text-[#07111d] shadow-[0_0_20px_rgba(56,189,248,0.2)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">{isSaving ? "Saving…" : "Save profile"}</button>
              <p className="break-all font-[family-name:var(--font-data)] text-[10px] text-[var(--text-muted)]">Signed in as {user?.email}</p>
            </form>

            <section className="panel p-4">
              <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">HOLDINGS</h2>
              <form onSubmit={submitHolding} className="mt-4 grid grid-cols-2 gap-2">
                <input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} placeholder="Symbol" className={inputClass} required />
                <input type="number" min="0.000001" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Quantity" className={`${inputClass} font-[family-name:var(--font-data)]`} required />
                <input type="number" min="0" step="0.01" value={costBasis} onChange={(event) => setCostBasis(event.target.value)} placeholder="Average cost" className={`${inputClass} font-[family-name:var(--font-data)]`} required />
                <button className="focus-visible-ring rounded-lg border border-[var(--accent-signal)] px-3 py-2 text-sm text-[var(--accent-signal)]">Add holding</button>
              </form>
              <div className="mt-4 space-y-2">
                {holdings.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No holdings recorded.</p> : holdings.map((holding) => (
                  <div key={holding.id} className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] p-3">
                    <div><p className="font-[family-name:var(--font-data)]">{holding.symbol}</p><p className="text-xs text-[var(--text-muted)]">{holding.quantity} shares · {formatPrice(holding.average_cost_basis)} average</p></div>
                    <button type="button" onClick={() => void removeHolding(holding.id)} className="focus-visible-ring rounded-lg border border-[var(--negative)]/40 px-2 py-1 text-xs text-[var(--negative)]">Delete</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        {status ? <div role="status" className={`mt-4 rounded-lg border px-3 py-2 text-sm ${status === "Profile saved." ? "border-[var(--positive)]/40 bg-[var(--positive)]/10 text-[var(--positive)]" : "border-[var(--border-hairline)] text-[var(--text-muted)]"}`}><span>{status}</span>{status === "Could not load your profile. Try again." ? <button type="button" onClick={() => setReloadCount((value) => value + 1)} className="focus-visible-ring ml-3 rounded-lg border border-[var(--accent-signal)] px-3 py-1 text-[var(--accent-signal)]">Retry</button> : null}</div> : null}
      </div>
    </main>
  );
}
