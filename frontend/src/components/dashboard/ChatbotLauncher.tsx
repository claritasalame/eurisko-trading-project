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
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="chatbot-pulse focus-visible-ring fixed right-6 bottom-6 z-[70] flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/70 bg-[linear-gradient(135deg,var(--accent-teal),var(--accent-violet))] text-slate-950 shadow-[0_18px_48px_rgba(56,189,248,0.48)] transition-transform hover:scale-105"
      >
        <span className="sr-only">Open live assistant</span>
        <span className="relative">
          {hasQueuedInsight ? (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[var(--positive)] shadow-[0_0_0_4px_rgba(52,211,153,0.18)]" />
          ) : null}
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
          </svg>
        </span>
      </button>

      <div
        className={`fixed right-5 bottom-24 z-[65] w-[min(360px,calc(100vw-2rem))] transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <CopilotPanel />
      </div>
    </>
  );
}
