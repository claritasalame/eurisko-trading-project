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
      <IndexStrip />
      <NewsAggregator />
      <TradingSummary />
      <ChatbotLauncher />
    </main>
  );
}
