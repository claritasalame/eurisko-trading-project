"use client";

import { useState } from "react";
import { CopilotPanel } from "@/components/dashboard/CopilotPanel";

export function ChatbotLauncher() {
  const [open, setOpen] = useState(false);
  const hasQueuedInsight = false;

  return (
    <>
      <button
        type="button"
        aria-label="Open Copilot panel"
        onClick={() => setOpen((current) => !current)}
        className="chatbot-pulse focus-visible-ring relative fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-teal),var(--accent-violet))] text-[var(--bg-base)] shadow-[0_16px_40px_rgba(56,189,248,0.3)] transition-transform hover:scale-[1.03]"
      >
        <span className="sr-only">Open live assistant</span>
        <span className="relative">
          {hasQueuedInsight ? (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[var(--positive)] shadow-[0_0_0_4px_rgba(52,211,153,0.18)]" />
          ) : null}
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
          </svg>
        </span>
      </button>

      <div
        className={`fixed bottom-24 right-5 z-[55] w-[min(360px,calc(100vw-2rem))] origin-bottom-right transition-all duration-300 ${open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <CopilotPanel />
      </div>
    </>
  );
}
