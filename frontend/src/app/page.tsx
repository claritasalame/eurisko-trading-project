import { ChatbotLauncher } from "@/components/dashboard/ChatbotLauncher";
import { IndexStrip } from "@/components/dashboard/IndexStrip";
import { NewsAggregator } from "@/components/dashboard/NewsAggregator";
import { TradingSummary } from "@/components/dashboard/TradingSummary";
import { Hero } from "@/components/marketing/Hero";
import { NavBar } from "@/components/marketing/NavBar";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <NavBar />
      <Hero />
      <section id="features" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold">One workspace for market decisions</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{[["AI copilot", "Ask questions grounded in live quotes, current news, and your portfolio."], ["Market intelligence", "Track major indices, watchlist prices, technical indicators, and real article sources."], ["Portfolio context", "Review your holdings, daily movement, and risk profile without fabricated demo balances."]].map(([title, copy]) => <article key={title} className="panel p-5"><h3 className="font-semibold text-[var(--accent-signal)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{copy}</p></article>)}</div></section>
      <section id="how-it-works" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold">How it works</h2><p className="mt-3 max-w-3xl leading-7 text-[var(--text-muted)]">MarketMIND combines Yahoo Finance market data with recently ingested financial news. Sign in to add holdings and receive portfolio-aware analysis from the copilot.</p></section>
      <IndexStrip />
      <NewsAggregator />
      <TradingSummary />
      <section id="trust" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><div className="panel p-6"><h2 className="text-2xl font-bold">Data and responsibility</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">Market data is sourced from Yahoo Finance and may be delayed. MarketMIND is an educational project, not a licensed financial adviser, and its analysis should not be treated as personalized financial advice.</p></div></section>
      <ChatbotLauncher />
    </main>
  );
}
