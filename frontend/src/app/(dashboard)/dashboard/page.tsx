"use client";

import { useState } from "react";
import { CopilotPanel } from "@/components/dashboard/CopilotPanel";
import { MarketChart } from "@/components/dashboard/MarketChart";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
import { TopBar } from "@/components/dashboard/TopBar";
import { WatchlistRail } from "@/components/dashboard/WatchlistRail";

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-[1600px] p-3 lg:p-5">
        <TopBar selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol} />
        <div className="mt-4 grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          <div className="order-2 xl:order-1">
            <WatchlistRail selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol} />
          </div>
          <div className="order-1 xl:order-2">
            <MarketChart symbol={selectedSymbol} />
            <NewsFeed symbol={selectedSymbol} />
          </div>
          <div className="order-3 xl:order-3">
            <CopilotPanel />
          </div>
        </div>
      </div>
    </main>
  );
}