import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shortMonth(date: Date) {
  return date.toLocaleString("en-IN", { month: "short", year: "2-digit" });
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  const db = getDb();

  // Build last 6 months buckets
  const now = new Date();
  const buckets: { key: string; label: string; revenue: number; orders: number; commission: number; payout: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: shortMonth(d), revenue: 0, orders: 0, commission: 0, payout: 0 });
  }

  if (!db) {
    return Response.json({ monthly: buckets, summary: { totalOrders: 0, totalRevenue: 0, totalCommission: 0, vendorPayout: 0, avgOrderValue: 0, revenueChange: null, ordersChange: null } });
  }

  const { data, error } = await db
    .from("order_commissions")
    .select("order_total, commission_amount, vendor_payout, created_at")
    .eq("vendor_email", email.toLowerCase().trim());

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  // Fill buckets
  for (const row of rows) {
    const d = new Date(row.created_at);
    const key = monthKey(d);
    const bucket = buckets.find(b => b.key === key);
    if (bucket) {
      bucket.revenue += Number(row.order_total);
      bucket.commission += Number(row.commission_amount);
      bucket.payout += Number(row.vendor_payout);
      bucket.orders++;
    }
  }

  // Summary
  const totalRevenue = rows.reduce((s, r) => s + Number(r.order_total), 0);
  const totalOrders = rows.length;
  const totalCommission = rows.reduce((s, r) => s + Number(r.commission_amount), 0);
  const vendorPayout = rows.reduce((s, r) => s + Number(r.vendor_payout), 0);
  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

  // Month-over-month change (current month vs previous)
  const currentBucket = buckets[buckets.length - 1];
  const prevBucket = buckets[buckets.length - 2];

  function pctChange(curr: number, prev: number): string | null {
    if (!prev) return curr > 0 ? "+100%" : null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    return (pct >= 0 ? "+" : "") + pct + "%";
  }

  const revenueChange = pctChange(currentBucket.revenue, prevBucket.revenue);
  const ordersChange = pctChange(currentBucket.orders, prevBucket.orders);

  return Response.json({
    monthly: buckets,
    summary: { totalOrders, totalRevenue, totalCommission, vendorPayout, avgOrderValue, revenueChange, ordersChange },
  });
}
