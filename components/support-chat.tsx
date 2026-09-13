"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  LifeBuoy,
  Loader2,
  Send,
  X,
} from "lucide-react";

type WidgetMessage = {
  id: string;
  sender_role: string;
  kind: string;
  body: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type SavedConversation = {
  id: string;
  token: string;
};

const STORAGE_KEY = "ks_support_conv";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SupportChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"form" | "chat">("form");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [lastUserMsg, setLastUserMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, phase, open]);

  const startFresh = useCallback(() => {
    setMessages([]);
    setConvId(null);
    setToken(null);
    setPhase("form");
  }, []);

  const loadConversation = useCallback(async (id: string, tkn: string) => {
    setLoading(true);
    setPhase("chat");
    try {
      const res = await fetch(`/api/support/conversations/${id}?token=${encodeURIComponent(tkn)}`);
      const d = await res.json();
      if (d.messages) setMessages(d.messages);
    } catch {
      startFresh();
    } finally {
      setLoading(false);
    }
  }, [startFresh]);

  const openWidget = useCallback(async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedConversation;
        if (parsed.id && parsed.token) {
          setConvId(parsed.id);
          setToken(parsed.token);
          await loadConversation(parsed.id, parsed.token);
        }
      } catch {
        startFresh();
      }
    } else if (user) {
      // Try to resume a conversation tied to this account
      const res = await fetch("/api/support/conversations/me");
      const d = await res.json();
      if (d.conversations && d.conversations.length > 0) {
        const c = d.conversations[0];
        setConvId(c.id);
        setToken("");
        await loadConversation(c.id, "");
      } else {
        setPhase("form");
      }
    } else {
      setPhase("form");
    }
    setOpen(true);
  }, [user, loadConversation, startFresh]);

  async function createConversation(e?: React.FormEvent) {
    e?.preventDefault();
    if (!subject.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/support/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          subject: subject.trim(),
          message: lastUserMsg.trim() || subject.trim(),
        }),
      });
      const d = await res.json();
      if (d.conversation) {
        const tkn = (d.accessToken as string | null) ?? "";
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: d.conversation.id, token: tkn }));
        setConvId(d.conversation.id);
        setToken(tkn);
        setMessages(d.messages ?? []);
        setPhase("chat");
      } else {
        // Handled by UI error below via generic failure
        alert(d.error ?? "Something went wrong");
      }
    } catch {
      alert("Could not start a conversation. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(text?: string) {
    const body = (text ?? input).trim();
    if (!convId || !body) return;
    const tkn = token ?? "";
    setSending(true);
    const optimistic: WidgetMessage = {
      id: `opt-${Date.now()}`,
      sender_role: "user",
      kind: "text",
      body,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      const res = await fetch(`/api/support/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tkn, text: body }),
      });
      const d = await res.json();
      if (d.messages) setMessages(d.messages.filter((m: WidgetMessage) => !m.id.startsWith("opt-") || d.messages.length > 1));
      else setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  // Poll for new messages while the chat is open
  useEffect(() => {
    if (!open || !convId) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/support/conversations/${convId}?token=${encodeURIComponent(token ?? "")}`);
        const d = await res.json();
        if (d.messages?.length) setMessages(d.messages);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [open, convId, token]);

  const quickPrompts = [
    "I paid but didn't get my download",
    "My download link expired",
    "I need a refund",
    "How do I check my order status?",
  ];

  return (
    <>
      {/* Launcher — distinct pill so it doesn't look like the WhatsApp button */}
      <button
        onClick={() => (open ? setOpen(false) : openWidget())}
        aria-label="Open support chat"
        title="Chat with support"
        className="focus-ring fixed bottom-5 right-24 z-50 flex h-14 items-center gap-2 rounded-full bg-neutral-900 pl-4 pr-5 text-white shadow-lift transition-all duration-200 hover:-translate-y-1 hover:bg-black animate-fade-in"
      >
        {open ? <X size={22} /> : <LifeBuoy size={22} />}
        {!open && (
          <>
            <span className="hidden text-sm font-semibold sm:inline">Support</span>
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-neutral-900" />
          </>
        )}
      </button>

      {/* Panel — anchored to the same (right) side, above the buttons */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] max-h-[80vh] w-[90vw] max-w-[360px] animate-scale-check flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-warm-lg">
          {/* Header */}
          <div className="flex items-center gap-3 bg-neutral-900 px-4 py-3 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/10">
              <LifeBuoy size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Keevan Support</p>
              <p className="text-[11px] text-white/70">We usually reply within a few hours</p>
            </div>
            <span className="flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-300 opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-300" />
            </span>
          </div>

          {loading && phase === "chat" ? (
            <div className="grid flex-1 place-items-center">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : phase === "form" ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-3 rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2.5 text-sm text-brand-black">
                Hi 👋 How can we help? Start a conversation and the bot will try to resolve it instantly.
              </div>
              <form onSubmit={createConversation} className="space-y-2.5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (required)"
                  type="email"
                  required
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What do you need help with?"
                  required
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <textarea
                  value={lastUserMsg}
                  onChange={(e) => setLastUserMsg(e.target.value)}
                  placeholder="Tell us more (optional)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-deep disabled:opacity-50"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Start conversation
                </button>
              </form>

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Common issues</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setSubject(q);
                        setLastUserMsg(q);
                      }}
                      className="rounded-full border border-brand-green/30 bg-brand-green/5 px-3 py-1.5 text-xs font-semibold text-brand-green-deep transition hover:bg-brand-green/10"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 p-4">
              {messages.map((m) =>
                m.kind === "download" || m.kind === "download_action" ? (
                  (() => {
                    const meta = (m.metadata ?? {}) as { url?: string; download_url?: string; download_token?: string };
                    const raw = meta.url ?? meta.download_url;
                    const link = raw ? new URL(raw, window.location.origin).href : undefined;
                    return (
                      <div key={m.id} className="rounded-2xl rounded-bl-sm bg-brand-green/5 border border-brand-green/30 p-3">
                        <p className="text-sm text-brand-black">{m.body}</p>
                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-green px-3 py-2.5 text-sm font-bold text-white hover:bg-brand-green-deep"
                          >
                            Download now
                          </a>
                        )}
                      </div>
                    );
                  })()
                ) : m.kind === "bot_status" ? (
                  <div
                    key={m.id}
                    className={`rounded-2xl rounded-bl-sm px-3 py-2.5 text-sm font-semibold ${
                      m.body.startsWith("✅") || m.body.startsWith("🎉")
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : m.body.startsWith("⚠️")
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {m.body}
                  </div>
                ) : m.kind === "bot_log" ? (
                  <div key={m.id} className="text-xs text-muted">{m.body}</div>
                ) : m.sender_role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-green px-3.5 py-2 text-sm text-white">
                      {m.body}
                      <p className="mt-0.5 text-right text-[10px] text-white/70">{timeAgo(m.created_at)}</p>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-neutral-100 px-3.5 py-2 text-sm text-brand-black">
                      <p className="mb-0.5 text-[10px] font-bold text-brand-green">Keevan Support</p>
                      {m.body}
                      <p className="mt-0.5 text-right text-[10px] text-muted">{timeAgo(m.created_at)}</p>
                    </div>
                  </div>
                ),
              )}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2 text-sm text-muted">
                    <Loader2 size={13} className="animate-spin" />
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Composer */}
          {phase === "chat" && (
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={sending || !input.trim()}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-green text-white hover:bg-brand-green-deep disabled:opacity-40"
                  aria-label="Send message"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <button
                onClick={() => { localStorage.removeItem(STORAGE_KEY); startFresh(); }}
                className="mt-2 text-[11px] font-semibold text-muted hover:text-brand-green"
              >
                Start a new conversation
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}