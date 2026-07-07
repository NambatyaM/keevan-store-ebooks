import { NextRequest } from "next/server";
import { json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const [
    { count: totalCreators },
    { count: totalStores },
    { count: totalProducts },
    { count: activeStores },
    { count: suspendedStores },
    { count: pendingWithdrawals },
    { count: newRegistrations },
    { count: totalBuyers },
    { count: pendingRefunds }
  ] = await Promise.all([
    supabase.from("creators").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "suspended"),
    supabase.from("withdrawal_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("buyers").select("*", { count: "exact", head: true }),
    supabase.from("refunds").select("*", { count: "exact", head: true }).eq("status", "pending")
  ]);

  const { count: paidOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "paid");

  const { data: revenueData } = await supabase
    .from("orders")
    .select("amount,platform_fee")
    .eq("status", "paid");

  const totalSales = paidOrders ?? 0;
  const totalRevenue = (revenueData ?? []).reduce((sum, o) => sum + Number(o.amount), 0);
  const platformEarnings = (revenueData ?? []).reduce((sum, o) => sum + Number(o.platform_fee), 0);

  return json({
    stats: {
      totalCreators: totalCreators ?? 0,
      totalStores: totalStores ?? 0,
      totalProducts: totalProducts ?? 0,
      totalSales,
      totalRevenue,
      platformEarnings,
      activeStores: activeStores ?? 0,
      suspendedStores: suspendedStores ?? 0,
      totalBuyers: totalBuyers ?? 0,
      pendingWithdrawals: pendingWithdrawals ?? 0,
      pendingRefunds: pendingRefunds ?? 0,
      newRegistrations: newRegistrations ?? 0
    }
  });
});
