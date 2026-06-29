"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { formatUgx, site } from "@/lib/constants";
import { Wallet, TrendingUp, Send, Clock, Smartphone, Landmark, Banknote, ArrowRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  products: { title: string; slug: string } | null;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  payout_method: string;
  payout_details: unknown;
  admin_notes?: string | null;
  requested_at: string;
  processed_at: string | null;
};

const PAGE_SIZE = 25;

const COLORS = ["#00854A", "#10B981", "#E5E7EB"];

export default function CreatorEarningsPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("mtn");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [earningsPage, setEarningsPage] = useState(1);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/orders?limit=500").then((r) => r.json()).then((d) => setOrders(d.orders ?? [])),
      fetch("/api/withdrawals").then((r) => r.json()).then((d) => setWithdrawals(d.withdrawals ?? [])),
      fetch("/api/auth/me").then((r) => r.json()).then((d) => {
        if (d.profile) {
          setBalance(Number(d.profile.available_balance) || 0);
          setTotalEarned(Number(d.profile.total_earnings) || 0);
        }
      }),
    ])
      .catch((err) => { console.error("Earnings load error:", err); setError("Failed to load earnings data."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "completed");
  const totalGross = paidOrders.reduce((s, o) => s + o.amount, 0);
  const totalFees = paidOrders.reduce((s, o) => s + o.platform_fee, 0);
  const totalWithdrawn = withdrawals.filter((w) => w.status === "paid").reduce((s, w) => s + w.amount, 0);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + w.amount, 0);

  // Earnings by month for chart
  const monthlyEarnings = useMemo(() => {
    const map = new Map<string, { gross: number; fee: number; net: number }>();
    paidOrders.forEach((o) => {
      const month = new Date(o.created_at).toLocaleDateString("en-UG", { month: "short", year: "numeric" });
      const existing = map.get(month) ?? { gross: 0, fee: 0, net: 0 };
      existing.gross += o.amount;
      existing.fee += o.platform_fee;
      existing.net += o.amount - o.platform_fee;
      map.set(month, existing);
    });
    return Array.from(map.entries()).map(([month, data]) => ({ month, ...data }));
  }, [paidOrders]);

  const earningsPaginated = paidOrders.slice(
    (earningsPage - 1) * PAGE_SIZE,
    earningsPage * PAGE_SIZE,
  );

  const withdrawalsPaginated = withdrawals.slice(
    (withdrawalsPage - 1) * PAGE_SIZE,
    withdrawalsPage * PAGE_SIZE,
  );

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (numAmount < site.minimumWithdrawal) {
      toast("error", `Minimum withdrawal is ${formatUgx(site.minimumWithdrawal)}`);
      return;
    }
    if (numAmount > balance) {
      toast("error", "Insufficient balance");
      return;
    }
    if (!payoutDetails.trim()) {
      toast("error", "Please provide payment details");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          payoutMethod,
          payoutDetails: { value: payoutDetails.trim() },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast("error", data.error?.message ?? "Request failed");
      } else {
        toast("success", "Withdrawal requested successfully!");
        setWithdrawModal(false);
        setAmount("");
        setPayoutDetails("");
        load();
      }
    } catch {
      toast("error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell title="Earnings & Withdrawals" subtitle="Track your revenue and request payouts" role="creator">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available to Withdraw"
          value={formatUgx(balance)}
          sublabel={`Min. withdrawal: ${formatUgx(site.minimumWithdrawal)}`}
          icon={<Wallet size={22} />}
          green
        />
        <StatCard
          label="Total Earned (All Time)"
          value={formatUgx(totalEarned)}
          sublabel="After 10% platform fee"
          icon={<TrendingUp size={22} />}
        />
        <StatCard
          label="Total Withdrawn"
          value={formatUgx(totalWithdrawn)}
          sublabel="Paid out to you"
          icon={<Send size={22} />}
        />
        <StatCard
          label="Pending Withdrawal"
          value={formatUgx(pendingWithdrawals)}
          sublabel="Processing: 1-3 business days"
          icon={<Clock size={22} />}
        />
      </div>

      {/* Withdraw button */}
      <div className="mb-6">
        <button
          onClick={() => {
            if (balance < site.minimumWithdrawal) {
              toast("warning", `You need ${formatUgx(site.minimumWithdrawal)} to withdraw. You have ${formatUgx(balance)}`);
              return;
            }
            setWithdrawModal(true);
          }}
          disabled={balance < site.minimumWithdrawal}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-6 py-3 font-bold text-white transition hover:bg-brand-green-deep disabled:cursor-not-allowed disabled:opacity-50"
          title={balance < site.minimumWithdrawal ? `Minimum withdrawal: ${formatUgx(site.minimumWithdrawal)}` : ""}
        >
          <Send size={18} />
          Request Withdrawal
          <ArrowRight size={18} />
        </button>
        {balance < site.minimumWithdrawal && (
          <p className="mt-1 text-xs text-muted">
            You need {formatUgx(site.minimumWithdrawal)} to withdraw. You currently have {formatUgx(balance)}.
          </p>
        )}
      </div>

      {/* Earnings breakdown chart */}
      <div className="mb-6 rounded-xl border border-border bg-surface-card p-5 shadow-card">
        <h3 className="mb-4 font-bold text-brand-black">Earnings Breakdown by Month</h3>
        {loading ? (
          <div className="h-64 rounded-lg bg-neutral-100 animate-pulse" />
        ) : monthlyEarnings.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted">No data yet</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEarnings} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="fee" name="Platform Fee (10%)" stackId="a" fill="#E5E7EB" radius={[0, 0, 0, 0]} />
                <Bar dataKey="net" name="Your Earnings (90%)" stackId="a" fill="#00854A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Withdrawal history */}
      <div className="mb-6">
        <h3 className="mb-3 font-display text-xl font-bold text-brand-black">Withdrawal History</h3>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : withdrawals.length === 0 ? (
          <EmptyState
            icon={<Send size={48} strokeWidth={1.2} />}
            title="No withdrawals yet"
            description="When you request a withdrawal, it will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 text-left font-semibold text-muted">Request ID</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted">Method</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted">Requested</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsPaginated.map((w) => (
                    <tr key={w.id} className="border-b border-border transition hover:bg-surface">
                      <td className="px-4 py-3 font-mono text-xs text-muted">#{w.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatUgx(w.amount)}</td>
                      <td className="px-4 py-3 text-muted capitalize">{w.payout_method?.replace("_", " ") || "—"}</td>
                      <td className="px-4 py-3 text-muted">{new Date(w.requested_at).toLocaleDateString("en-UG")}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getBadgeVariant(w.status)}>{w.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {w.status === "rejected" && w.admin_notes ? (
                          <span className="text-error">{w.admin_notes}</span>
                        ) : w.admin_notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {withdrawals.length > PAGE_SIZE && (
          <div className="mt-4">
            <Pagination
              page={withdrawalsPage}
              totalPages={Math.ceil(withdrawals.length / PAGE_SIZE)}
              totalItems={withdrawals.length}
              pageSize={PAGE_SIZE}
              onPageChange={setWithdrawalsPage}
            />
          </div>
        )}
      </div>

      {/* Earnings history */}
      <div>
        <h3 className="mb-3 font-display text-xl font-bold text-brand-black">Earnings History</h3>
        {loading ? (
          <TableSkeleton rows={5} />
        ) : paidOrders.length === 0 ? (
          <EmptyState
            icon={<Banknote size={48} strokeWidth={1.2} />}
            title="No earnings yet"
            description="Your earnings from sales will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 text-left font-semibold text-muted">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted">Order ID</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Gross</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Fee (10%)</th>
                    <th className="px-4 py-3 text-right font-semibold text-success">Your Earnings (90%)</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsPaginated.map((o) => (
                    <tr key={o.id} className="border-b border-border transition hover:bg-surface">
                      <td className="px-4 py-3 text-muted">{new Date(o.created_at).toLocaleDateString("en-UG")}</td>
                      <td className="px-4 py-3 font-medium text-brand-black">{o.products?.title ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">#{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-right">{formatUgx(o.amount)}</td>
                      <td className="px-4 py-3 text-right text-muted">{formatUgx(o.platform_fee)}</td>
                      <td className="px-4 py-3 text-right font-bold text-success">
                        {formatUgx(o.amount - o.platform_fee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-surface font-bold">
                    <td className="px-4 py-3 text-muted" colSpan={3}>Total</td>
                    <td className="px-4 py-3 text-right">{formatUgx(totalGross)}</td>
                    <td className="px-4 py-3 text-right text-muted">{formatUgx(totalFees)}</td>
                    <td className="px-4 py-3 text-right text-success">{formatUgx(totalGross - totalFees)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        {paidOrders.length > PAGE_SIZE && (
          <div className="mt-4">
            <Pagination
              page={earningsPage}
              totalPages={Math.ceil(paidOrders.length / PAGE_SIZE)}
              totalItems={paidOrders.length}
              pageSize={PAGE_SIZE}
              onPageChange={setEarningsPage}
            />
          </div>
        )}
      </div>

      {/* Withdrawal request modal */}
      <Modal open={withdrawModal} onClose={() => setWithdrawModal(false)} title="Request Withdrawal" size="md">
        <form onSubmit={handleRequestWithdrawal} className="space-y-5">
          <div className="rounded-lg bg-brand-mist p-4 text-center">
            <p className="text-sm text-muted">Available Balance</p>
            <p className="text-3xl font-black text-brand-green">{formatUgx(balance)}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-black mb-1.5">Amount (UGX)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={site.minimumWithdrawal}
              max={balance}
              className="w-full rounded-lg border border-border px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder={`Min: ${formatUgx(site.minimumWithdrawal)}`}
              required
            />
            {amount && (
              <p className="mt-1 text-sm text-success">
                You will receive {formatUgx(Number(amount))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-black mb-2">Withdrawal Method</label>
            <div className="grid gap-2">
              {[
                { value: "mtn", label: "MTN Mobile Money", icon: <Smartphone size={18} /> },
                { value: "airtel", label: "Airtel Money", icon: <Smartphone size={18} /> },
                { value: "bank", label: "Bank Transfer", icon: <Landmark size={18} /> },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                    payoutMethod === method.value
                      ? "border-brand-green bg-brand-mist"
                      : "border-border hover:border-brand-green"
                  }`}
                >
                  <input
                    type="radio"
                    name="payoutMethod"
                    value={method.value}
                    checked={payoutMethod === method.value}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="accent-brand-green"
                  />
                  <span>{method.icon}</span>
                  <span className="font-medium">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-black mb-1.5">
              {payoutMethod === "bank" ? "Bank Account Details" : "Mobile Money Number"}
            </label>
            <input
              type="text"
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder={payoutMethod === "bank" ? "Bank name, account name, account number" : "e.g. 0772XXXXXX"}
              required
            />
          </div>

          <p className="text-xs text-muted">
            Withdrawals are processed within 1-3 business days and approved by the Keevan Store admin team.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-green py-3 font-bold text-white transition hover:bg-brand-green-deep disabled:opacity-50"
          >
            {submitting ? "Submitting..." : `Request ${formatUgx(Number(amount) || 0)}`}
          </button>
        </form>
      </Modal>
    </DashboardShell>
  );
}
