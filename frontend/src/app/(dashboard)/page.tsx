import { CopilotPanel } from "@/components/dashboard/CopilotPanel";
import { MarketChart } from "@/components/dashboard/MarketChart";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
import { TopBar } from "@/components/dashboard/TopBar";
import { WatchlistRail } from "@/components/dashboard/WatchlistRail";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-[1600px] p-3 lg:p-5">
        <TopBar />

        <div className="mt-4 grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          <div className="order-2 xl:order-1">
            <WatchlistRail />
          </div>

          <div className="order-1 xl:order-2">
            <MarketChart symbol="AAPL" />
            <NewsFeed symbol="AAPL" />
          </div>

          <div className="order-3 xl:order-3">
            <CopilotPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
