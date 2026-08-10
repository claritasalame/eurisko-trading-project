"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  ChatSessionListResponse,
  createChatSession,
  getChatSessionMessages,
  getChatSessions,
  sendChatMessage,
} from "@/lib/api";
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
    content:
      "I can compare price action, catalysts, and risk posture for your symbols.",
  },
];

function relativeTime(value: string) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function CopilotPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionListResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();

  const promptList = useMemo(() => promptExamples, []);

  const refreshSessions = async () => {
    if (!user) return;
    setSessions(await getChatSessions());
  };

  useEffect(() => {
    if (!user) return;
    setIsHistoryLoading(true);
    refreshSessions()
      .catch(() => setError("Could not load previous chats."))
      .finally(() => setIsHistoryLoading(false));
  }, [user]);

  const openSession = async (session: ChatSessionListResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      const storedMessages = await getChatSessionMessages(session.id);
      setSessionId(session.id);
      setMessages(
        storedMessages
          .filter(
            (message) =>
              message.role === "user" || message.role === "assistant",
          )
          .map((message) => ({
            id: message.id,
            role: message.role as "user" | "assistant",
            content: message.content,
          })),
      );
      setShowHistory(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not open that conversation.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages(initialMessages);
    setInput("");
    setError(null);
    setShowHistory(false);
  };

  const sendMessage = async (content: string) => {
    const nextContent = content.trim();
    if (!nextContent || isLoading) return;

    const symbol = nextContent
      .match(/\b(AAPL|MSFT|NVDA|TSLA|GOOGL)\b/i)?.[1]
      ?.toUpperCase();
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: "user", content: nextContent },
    ]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const currentSessionId = sessionId ?? (await createChatSession()).id;
      if (!sessionId) setSessionId(currentSessionId);
      const result = await sendChatMessage(
        currentSessionId,
        nextContent,
        symbol,
      );
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
      await refreshSessions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Copilot is unavailable right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {maximized ? (
        <button
          type="button"
          aria-label="Restore docked Copilot"
          className="fixed inset-0 z-[79] cursor-default bg-black/70 backdrop-blur-sm"
          onClick={() => setMaximized(false)}
        />
      ) : null}
      <aside
        data-copilot-mode={maximized ? "maximized" : "docked"}
        className={`panel ${maximized ? "fixed top-1/2 left-1/2 z-[80] h-[90vh] w-[90vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-hidden p-4 shadow-[0_28px_100px_rgba(0,0,0,0.65)]" : `${collapsed ? "w-[78px]" : "w-full"} p-3`} transition-all duration-300`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="focus-visible-ring rounded-lg border border-[var(--border-hairline)] px-2 py-1 text-[var(--text-muted)]"
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? "→" : "←"}
          </button>
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.14em] text-[var(--text-muted)]">
                COPILOT
              </h2>
              {user ? (
                <button
                  type="button"
                  aria-label="View chat history"
                  onClick={() => setShowHistory((value) => !value)}
                  className="focus-visible-ring rounded-lg border border-[var(--border-hairline)] px-2 py-1 text-xs text-[var(--text-muted)]"
                >
                  History
                </button>
              ) : null}
              {user ? (
                <button
                  type="button"
                  onClick={startNewChat}
                  className="focus-visible-ring rounded-lg border border-[var(--accent-signal)]/50 px-2 py-1 text-xs text-[var(--accent-signal)]"
                >
                  New chat
                </button>
              ) : null}
              <button
                type="button"
                aria-label={
                  maximized ? "Restore docked Copilot" : "Maximize Copilot"
                }
                title={maximized ? "Restore docked view" : "Maximize"}
                onClick={() => {
                  setCollapsed(false);
                  setMaximized((value) => !value);
                }}
                className="focus-visible-ring rounded-lg border border-[var(--border-hairline)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {maximized ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M8 3v5H3M16 21v-5h5M3 8l5-5M21 16l-5 5" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
                  </svg>
                )}
              </button>
            </div>
          ) : null}
        </div>

        {collapsed ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="h-10 w-10 rounded-full border border-[var(--accent-signal)] bg-[var(--accent-signal)]/10" />
            <div className="h-3 w-3 animate-pulse rounded-full bg-[var(--accent-signal)]" />
          </div>
        ) : !isAuthLoading && !user ? (
          <div className="flex min-h-[560px] flex-col items-center justify-center rounded-xl bg-[var(--bg-base)] p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Sign in to use the portfolio copilot.
            </p>
            <Link
              href="/login"
              className="focus-visible-ring mt-4 rounded-lg bg-[var(--accent-signal)] px-4 py-2 text-sm font-semibold text-[var(--bg-base)]"
            >
              Sign in
            </Link>
          </div>
        ) : showHistory ? (
          <div
            className={`${maximized ? "h-[calc(90vh-5.5rem)] overflow-y-auto" : "min-h-[560px]"} rounded-xl bg-[var(--bg-base)] p-3`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Previous chats
              </h3>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-xs text-[var(--accent-signal)]"
              >
                Back
              </button>
            </div>
            {isHistoryLoading ? (
              <div className="space-y-2">
                <div className="skeleton-row rounded-lg" />
                <div className="skeleton-row rounded-lg" />
                <div className="skeleton-row rounded-lg" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-5 text-center text-sm text-[var(--text-muted)]">
                Your past conversations will show up here.
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => void openSession(session)}
                    className="focus-visible-ring block w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 text-left hover:border-[var(--accent-signal)]/50"
                  >
                    <span className="block truncate text-sm text-[var(--text-primary)]">
                      {session.preview}
                    </span>
                    <span className="mt-1 block font-[family-name:var(--font-data)] text-[10px] text-[var(--text-muted)]">
                      {relativeTime(session.last_activity_at)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex ${maximized ? "h-[calc(90vh-5.5rem)]" : "min-h-[560px]"} flex-col`}
          >
            <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-[var(--bg-base)] p-3">
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
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "bg-[var(--bg-surface-raised)] text-[var(--text-primary)]" : "bg-[var(--bg-surface)] text-[var(--text-primary)]"}`}
                    >
                      <span
                        className={`mb-1 block ${message.role === "assistant" ? "text-[var(--accent-signal)]" : "text-[var(--text-muted)]"}`}
                      >
                        {message.role === "assistant" ? "• AI" : "You"}
                      </span>
                      {message.quote ? (
                        <div className="mb-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-base)] px-3 py-2 font-[family-name:var(--font-data)]">
                          <div className="flex items-center justify-between gap-3">
                            <span>{message.quote.symbol}</span>
                            <span>{formatPrice(message.quote.price)}</span>
                          </div>
                          <span
                            className={
                              message.quote.day_change_percent >= 0
                                ? "text-[var(--positive)]"
                                : "text-[var(--negative)]"
                            }
                          >
                            {isFiniteNumber(message.quote.day_change_percent) &&
                            message.quote.day_change_percent > 0
                              ? "+"
                              : ""}
                            {formatPercent(message.quote.day_change_percent)}
                          </span>
                        </div>
                      ) : null}
                      <span className="whitespace-pre-wrap">
                        {message.content}
                      </span>
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
              {isLoading ? (
                <div
                  className="skeleton-row w-3/4 rounded-lg"
                  aria-label="Copilot is thinking"
                />
              ) : null}
              {error ? (
                <p className="text-xs text-[var(--negative)]">{error}</p>
              ) : null}
            </div>

            <div className="mt-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent-signal)] opacity-80 idle-cursor" />
                <span className="text-[11px] text-[var(--text-muted)]">
                  Copilot is listening
                </span>
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
        )}
      </aside>
    </>
  );
}
