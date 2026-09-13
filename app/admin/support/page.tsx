"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from "lucide-react";

type AdminConversation = {
  id: string;
  subject: string;
  category: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_message_at: string;
  created_at: string;
  unread: number;
};

type Message = {
  id: string;
  sender_role: string;
  kind: string;
  body: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
};

type OrderContext = {
  order: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    buyer_email: string;
    buyer_name: string;
    created_at: string;
    paid_at: string | null;
    product_id: string;
    products: { title: string; slug: string } | null;
  };
  payment: { id: string; status: string; merchant_reference: string | null; tracking_id: string | null; created_at: string } | null;
  download: { token: string; expires_at: string | null; downloaded_at: string | null } | null;
  emails: {
    id: string;
    to_email: string;
    type: string;
    product_title: string | null;
    download_token: string | null;
    resend_id: string | null;
    delivery_status: string;
    created_at: string;
    delivered_at: string | null;
  }[];
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatMoney(amount: number, currency: string): string {
  const symbols: Record<string, string> = { UGX: "UGX ", USD: "$", KES: "KSH " };
  return `${symbols[currency] ?? `${currency} `}${amount.toLocaleString()}`;
}

export default function AdminSupportPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [counts, setCounts] = useState({ open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [orderContext, setOrderContext] = useState<OrderContext | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [botRunning, setBotRunning] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ status: statusFilter, search });
      const res = await fetch(`/api/admin/support?${q}`);
      const data = await res.json();
      setConversations(data.conversations ?? []);
      setCounts(data.counts ?? { open: 0, resolved: 0 });
    } catch {
      toast("error", "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, toast]);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    if (selectedId) {
      setDetailLoading(true);
      setOrderContext(null);
      fetch(`/api/admin/support/${selectedId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.conversation) {
            setMessages(d.messages ?? []);
            setOrderContext(d.orderContext ?? null);
          }
        })
        .catch(() => toast("error", "Failed to load conversation"))
        .finally(() => setDetailLoading(false));
    }
  }, [selectedId, toast]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function sendReply(markResolved: boolean, notifyCreator?: boolean) {
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: reply.trim(),
          status: markResolved ? "resolved" : "awaiting_admin",
          notifyCreator,
        }),
      });
      const d = await res.json();
      if (d.messages) setMessages(d.messages);
      setReply("");
      toast("success", markResolved ? "Replied and resolved" : "Reply sent");
      fetchList();
    } catch {
      toast("error", "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function runBot() {
    if (!selectedId) return;
    setBotRunning(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedId}/run-bot`, { method: "POST" });
      const d = await res.json();
      if (d.messages) setMessages(d.messages);
      toast("success", "Bot rules ran");
      fetchList();
    } catch {
      toast("error", "Bot run failed");
    } finally {
      setBotRunning(false);
    }
  }

  function viewPortalConversation() {
    if (!selectedId) return;
    window.open(`/api/support/conversations/${selectedId}?token=x`, "_blank");
  }

  const selected = conversations.find((c) => c.id === selectedId);
  const downloadUrl = (token: string | null | undefined) =>
    token ? `${window.location.origin}/api/downloads/${token}` : null;

  return (
    <DashboardShell
      title="Customer Support"
      subtitle="Help customers, verify payments, and re-send downloads"
      role="admin"
    >
      {/* Counts */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-brand-green" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Open issues</p>
              <p className="text-2xl font-extrabold text-brand-black">{counts.open}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-success" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Resolved</p>
              <p className="text-2xl font-extrabold text-brand-black">{counts.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      <div ref={listRef} className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Conversation list */}
        <div className="rounded-xl border border-border bg-surface-card shadow-card">
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email, name, subject..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
              <Search size={16} className="shrink-0 text-muted" />
            </div>
            <div className="mt-2 flex gap-1">
              {["open", "resolved", "closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    statusFilter === s ? "bg-brand-green text-white" : "bg-neutral-100 text-muted hover:bg-neutral-200"
                  }`}
                >
                  {s === "open" ? "Open" : s === "resolved" ? "Resolved" : "Closed"}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">No conversations found</div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`block w-full border-b border-border px-4 py-3 text-left transition ${
                    selectedId === c.id ? "bg-brand-green/5" : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-brand-black">
                      {c.name || c.email}
                      {c.unread > 0 && (
                        <span className="ml-2 rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.last_message_at)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">{c.subject}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {c.category} · {c.email}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="rounded-xl border border-border bg-surface-card shadow-card">
          {!selectedId ? (
            <div className="flex h-[70vh] items-center justify-center">
              <div className="text-center">
                <MessageCircle size={32} className="mx-auto mb-3 text-muted" />
                <p className="font-semibold text-brand-black">Select a conversation</p>
                <p className="mt-1 text-sm text-muted">to start helping a customer</p>
              </div>
            </div>
          ) : detailLoading ? (
            <TableSkeleton rows={6} />
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-brand-black">
                    {selected?.subject ?? "Conversation"}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {selected?.name || selected?.email} · {selected?.email}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {selected ? timeAgo(selected.created_at) : ""} ago · status:{" "}
                    <button
                      onClick={fetchList}
                      className="font-semibold text-brand-green"
                      title="Refresh status"
                    >
                      {selected?.status ?? ""}
                    </button>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={runBot}
                    disabled={botRunning}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {botRunning ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                    Run bot
                  </button>
                  <button
                    onClick={viewPortalConversation}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
                  >
                    <ExternalLink size={14} /> View
                  </button>
                </div>
              </div>

              {/* Order context */}
              {orderContext && (
                <div className="border-b border-border bg-neutral-50/60 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                    Order context
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border border-border bg-white p-3">
                      <p className="text-[11px] text-muted">Product</p>
                      <p className="text-sm font-semibold text-brand-black">
                        {orderContext.order.products?.title ?? "—"}
                      </p>
                      <p className="text-[11px] text-muted">Order: {orderContext.order.id}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-3">
                      <p className="text-[11px] text-muted">Payment</p>
                      <p className="text-sm font-semibold text-brand-black">
                        {orderContext.payment
                          ? formatMoney(orderContext.order.amount, orderContext.order.currency)
                          : formatMoney(orderContext.order.amount, orderContext.order.currency)}
                        {"  "}
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            orderContext.payment?.status === "paid" || orderContext.order.status === "completed" || orderContext.order.status === "pending"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {orderContext.payment?.status ?? orderContext.order.status}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted">
                        Ref: {orderContext.payment?.merchant_reference ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-3">
                      <p className="text-[11px] text-muted">Download</p>
                      {orderContext.download?.token ? (
                        <a
                          href={downloadUrl(orderContext.download.token) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-brand-green hover:underline"
                        >
                          Active link
                        </a>
                      ) : (
                        <p className="text-sm text-muted">No link issued yet</p>
                      )}
                      <p className="text-[11px] text-muted">
                        {orderContext.download?.downloaded_at ? "Downloaded" : "Not downloaded yet"}
                      </p>
                    </div>
                  </div>
                  {orderContext.emails.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                        Email deliveries
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {orderContext.emails.map((e) => (
                          <div
                            key={e.id}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              e.delivery_status === "delivered"
                                ? "bg-emerald-100 text-emerald-700"
                                : e.delivery_status === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {e.type} → {e.to_email} ({e.delivery_status})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="max-h-[42vh] space-y-3 overflow-y-auto p-4">
                {messages.map((m) =>
                  m.sender_role === "system" && m.kind === "bot_log" ? (
                    <div key={m.id} className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-muted">
                      <span className="font-bold">Bot:</span> {m.body}
                    </div>
                  ) : m.kind === "bot_status" ? (
                    <div
                      key={m.id}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        m.body.startsWith("✅") || m.body.startsWith("🎉")
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : m.body.startsWith("⚠️")
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {m.body}
                    </div>
                  ) : m.kind === "download" || m.kind === "download_action" ? (
                    (() => {
                      const meta = (m.metadata ?? {}) as { download_token?: string; token?: string };
                      const link = downloadUrl(
                        meta.download_token ??
                          meta.token ??
                          orderContext?.download?.token,
                      );
                      return (
                        <div key={m.id} className="rounded-lg border border-brand-green/30 bg-brand-green/5 p-3">
                          <p className="text-sm text-brand-black">{m.body}</p>
                          {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-green px-3 py-2 text-xs font-bold text-white hover:bg-brand-green-deep"
                            >
                              Download now <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      );
                    })()
                  ) : m.sender_role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-green px-4 py-2.5 text-sm text-white shadow-soft">
                        {m.body}
                        <p className="mt-0.5 text-right text-[10px] text-white/70">
                          {timeAgo(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-2.5 text-sm text-brand-black shadow-soft">
                        <p className="mb-0.5 text-[10px] font-bold text-brand-green">
                          {m.sender_role === "admin" ? "Admin" : "Bot"}
                        </p>
                        {m.body}
                        <p className="mt-0.5 text-right text-[10px] text-muted">{timeAgo(m.created_at)}</p>
                      </div>
                    </div>
                  ),
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              <div className="border-t border-border p-4">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  placeholder="Reply to the customer… (bot rules run automatically on paid/resolve keywords)"
                  className="w-full rounded-xl border border-border bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => sendReply(false)}
                    disabled={sending || !reply.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-deep disabled:opacity-50 disabled:hover:bg-brand-green"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    Send reply
                  </button>
                  <button
                    onClick={() => sendReply(true, orderContext?.order ? true : undefined)}
                    disabled={sending || !reply.trim()}
                    className="flex items-center gap-1.5 rounded-lg border border-success/40 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    Reply & resolve
                  </button>
                  <button
                    onClick={() => setReply("")}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted hover:bg-neutral-50"
                  >
                    <XCircle size={15} /> Clear
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}