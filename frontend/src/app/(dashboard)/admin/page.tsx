"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AdminUserResponse, ChatMessageResponse, ChatSessionResponse, getAdminSessionMessages, getAdminUsers, getAdminUserSessions } from "@/lib/api";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.is_admin) return;
    getAdminUsers().then(setUsers).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load users"));
  }, [user]);

  const inspectUser = async (nextUser: AdminUserResponse) => {
    setSelectedUser(nextUser);
    setSelectedSession(null);
    setMessages([]);
    try {
      setSessions(await getAdminUserSessions(nextUser.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load sessions");
    }
  };

  const inspectSession = async (sessionId: string) => {
    if (!selectedUser) return;
    setSelectedSession(sessionId);
    try {
      setMessages(await getAdminSessionMessages(selectedUser.id, sessionId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load messages");
    }
  };

  if (authLoading) return <main className="min-h-screen bg-[var(--bg-base)] p-6"><div className="skeleton-chart mx-auto max-w-5xl rounded-xl" /></main>;
  if (!user?.is_admin) return <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-6 text-[var(--text-primary)]"><div className="panel max-w-md p-8 text-center"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Administrator access is required to inspect user activity.</p><Link href="/dashboard" className="mt-5 inline-block rounded-lg border border-[var(--border-hairline)] px-4 py-2 text-sm">Back to dashboard</Link></div></main>;

  return (
    <main className="min-h-screen bg-[var(--bg-base)] p-4 text-[var(--text-primary)] lg:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between"><div><p className="font-[family-name:var(--font-display)] text-xs tracking-[0.18em] text-[var(--accent-signal)]">MARKETMIND ADMIN</p><h1 className="mt-1 text-2xl font-semibold">User activity</h1></div><Link href="/dashboard" className="rounded-lg border border-[var(--border-hairline)] px-3 py-2 text-sm text-[var(--text-muted)]">Back to dashboard</Link></div>
        {error ? <p role="alert" className="mb-4 text-sm text-[var(--negative)]">{error}</p> : null}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="panel overflow-hidden"><table className="w-full text-left text-sm"><thead className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]"><tr><th className="p-3">Email</th><th className="p-3">Created</th><th className="p-3">Role</th></tr></thead><tbody>{users.map((item) => <tr key={item.id} onClick={() => void inspectUser(item)} className={`cursor-pointer border-b border-[var(--border-hairline)]/60 hover:bg-[var(--bg-surface-raised)] ${selectedUser?.id === item.id ? "bg-[var(--bg-surface-raised)]" : ""}`}><td className="p-3">{item.email}</td><td className="p-3 font-[family-name:var(--font-data)] text-xs text-[var(--text-muted)]">{new Date(item.created_at).toLocaleString()}</td><td className="p-3">{item.is_admin ? <span className="rounded-full border border-[var(--accent-signal)]/50 px-2 py-1 text-xs text-[var(--accent-signal)]">Admin</span> : <span className="text-[var(--text-muted)]">User</span>}</td></tr>)}</tbody></table></section>
          <section className="panel p-4"><h2 className="text-sm font-semibold">{selectedUser ? `Sessions · ${selectedUser.email}` : "Select a user"}</h2><div className="mt-3 space-y-2">{selectedUser && sessions.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No chat sessions.</p> : sessions.map((session) => <button key={session.id} type="button" onClick={() => void inspectSession(session.id)} className={`block w-full rounded-lg border p-3 text-left font-[family-name:var(--font-data)] text-xs ${selectedSession === session.id ? "border-[var(--accent-signal)]" : "border-[var(--border-hairline)]"}`}><span className="block break-all">{session.id}</span><span className="mt-1 block text-[var(--text-muted)]">{new Date(session.created_at).toLocaleString()}</span></button>)}</div></section>
        </div>
        {selectedSession ? <section className="panel mt-4 p-4"><h2 className="text-sm font-semibold">Message history</h2><div className="mt-3 space-y-3">{messages.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No messages.</p> : messages.map((message) => <article key={message.id} className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] p-3"><div className="flex justify-between gap-3"><span className={message.role === "assistant" ? "text-[var(--accent-signal)]" : "text-[var(--text-primary)]"}>{message.role}</span><time className="font-[family-name:var(--font-data)] text-xs text-[var(--text-muted)]">{new Date(message.created_at).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-muted)]">{message.content}</p></article>)}</div></section> : null}
      </div>
    </main>
  );
}
