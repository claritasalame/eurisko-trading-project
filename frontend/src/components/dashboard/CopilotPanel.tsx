"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createChatSession, sendChatMessage } from "@/lib/api";
import { formatPercent, formatPrice, isFiniteNumber } from "@/lib/numbers";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; url: string; source: string }>;
  quote?: {
    symbol: string;
    price: number;
    day_change_percent: number;
    volume?: number | null;
  } | null;
};

const promptExamples = [
  "Summarize AAPL momentum",
  "How should I hedge TSLA risk?",
  "Compare NVDA and MSFT trend strength",
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "I can compare price action, catalysts, and risk posture for your symbols.",
  },
];

export function CopilotPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();

  const promptList = useMemo(() => promptExamples, []);

  const sendMessage = async (content: string) => {
    const nextContent = content.trim();
    if (!nextContent || isLoading) return;

    const symbol = nextContent.match(/\b(AAPL|MSFT|NVDA|TSLA|GOOGL)\b/i)?.[1]?.toUpperCase();
    setMessages((current) => [...current, { id: `${Date.now()}-user`, role: "user", content: nextContent }]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const currentSessionId = sessionId ?? (await createChatSession()).id;
      if (!sessionId) setSessionId(currentSessionId);
      const result = await sendChatMessage(currentSessionId, nextContent, symbol);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          quote: result.quote,
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Copilot is unavailable right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className={`panel ${collapsed ? "w-[78px]" : "w-full"} p-3 transition-all duration-200`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="focus-visible-ring rounded-lg border border-[var(--border-hairline)] px-2 py-1 text-[var(--text-muted)]"
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? "→" : "←"}
        </button>
        {!collapsed ? (
          <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
            COPILOT
          </h2>
        ) : null}
      </div>

      {collapsed ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="h-10 w-10 rounded-full border border-[var(--accent-signal)] bg-[var(--accent-signal)]/10" />
          <div className="h-3 w-3 animate-pulse rounded-full bg-[var(--accent-signal)]" />
        </div>
      ) : (
        !isAuthLoading && !user ? (
          <div className="flex min-h-[560px] flex-col items-center justify-center rounded-xl bg-[var(--bg-base)] p-6 text-center"><p className="text-sm text-[var(--text-muted)]">Sign in to use the portfolio copilot.</p><Link href="/login" className="focus-visible-ring mt-4 rounded-lg bg-[var(--accent-signal)] px-4 py-2 text-sm font-semibold text-[var(--bg-base)]">Sign in</Link></div>
        ) : (
        <div className="flex min-h-[560px] flex-col">
          <div className="flex-1 space-y-3 rounded-xl bg-[var(--bg-base)] p-3">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-center rounded-xl border border-dashed border-[var(--border-hairline)] p-4 text-sm text-[var(--text-muted)]">
                <p>Ask about a ticker, a trend, or your portfolio.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {promptList.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="focus-visible-ring rounded-full border border-[var(--border-hairline)] px-3 py-1 text-xs text-[var(--text-primary)]"
                      onClick={() => sendMessage(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "bg-[var(--bg-surface-raised)] text-[var(--text-primary)]" : "bg-[var(--bg-surface)] text-[var(--text-primary)]"}`}>
                    <span className={`mb-1 block ${message.role === "assistant" ? "text-[var(--accent-signal)]" : "text-[var(--text-muted)]"}`}>
                      {message.role === "assistant" ? "• AI" : "You"}
                    </span>
                    {message.quote ? (
                      <div className="mb-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-base)] px-3 py-2 font-[family-name:var(--font-data)]">
                        <div className="flex items-center justify-between gap-3">
                          <span>{message.quote.symbol}</span>
                          <span>{formatPrice(message.quote.price)}</span>
                        </div>
                        <span className={message.quote.day_change_percent >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
                          {isFiniteNumber(message.quote.day_change_percent) && message.quote.day_change_percent > 0 ? "+" : ""}{formatPercent(message.quote.day_change_percent)}
                        </span>
                      </div>
                    ) : null}
                    <span className="whitespace-pre-wrap">{message.content}</span>
                    {message.sources?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.sources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="focus-visible-ring max-w-full truncate rounded-full border border-[var(--border-hairline)] px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            title={source.title}
                          >
                            {source.title} · {source.source}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            {isLoading ? <div className="skeleton-row w-3/4 rounded-lg" aria-label="Copilot is thinking" /> : null}
            {error ? <p className="text-xs text-[var(--negative)]">{error}</p> : null}
          </div>

          <div className="mt-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent-signal)] opacity-80 idle-cursor" />
              <span className="text-[11px] text-[var(--text-muted)]">Copilot is listening</span>
            </div>
            <div className="flex gap-2">
              <input
                className="focus-visible-ring flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)]"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void sendMessage(input);
                }}
                placeholder="Ask about a ticker, a trend, or your portfolio."
                disabled={isLoading}
              />
              <button
                type="button"
                className="focus-visible-ring rounded-lg bg-[var(--accent-signal)] px-4 py-2 text-sm font-semibold text-[var(--bg-base)]"
                onClick={() => sendMessage(input)}
                disabled={isLoading}
              >
                {isLoading ? "Thinking…" : "Send"}
              </button>
            </div>
          </div>
        </div>
        )
      )}
    </aside>
  );
}
