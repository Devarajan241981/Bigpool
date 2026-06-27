import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return Response.json({ error: "Email required." }, { status: 400 });

  const db = getDb();
  if (!db) return Response.json({ commissions: [], summary: { totalRevenue: 0, totalCommission: 0, vendorPayout: 0, totalOrders: 0, pendingPayout: 0 } });

  const { data, error } = await db
    .from("order_commissions")
    .select("*")
    .eq("vendor_email", email.toLowerCase().trim())
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const commissions = data ?? [];
  const summary = {
    totalOrders: commissions.length,
    totalRevenue: commissions.reduce((s, c) => s + Number(c.order_total), 0),
    totalCommission: commissions.reduce((s, c) => s + Number(c.commission_amount), 0),
    vendorPayout: commissions.reduce((s, c) => s + Number(c.vendor_payout), 0),
    pendingPayout: commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.vendor_payout), 0),
  };

  return Response.json({ commissions, summary });
}

export async function POST(request: NextRequest) {
  const { vendorEmail, orderId, productName, orderTotal, commissionRate = 5 } = await request.json();
  if (!vendorEmail || !orderId || orderTotal == null) {
    return Response.json({ error: "vendorEmail, orderId and orderTotal are required." }, { status: 400 });
  }

  const commissionAmount = Math.round(orderTotal * commissionRate) / 100;
  const vendorPayout = orderTotal - commissionAmount;

  const db = getDb();
  if (!db) return Response.json({ success: true });

  const { data, error } = await db.from("order_commissions").insert({
    id: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    vendor_email: vendorEmail.toLowerCase().trim(),
    order_id: orderId,
    product_name: productName ?? "",
    order_total: orderTotal,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    vendor_payout: vendorPayout,
    status: "pending",
  }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { ids, status } = await request.json();
  if (!ids?.length || !status) return Response.json({ error: "ids and status required." }, { status: 400 });

  const db = getDb();
  if (!db) return Response.json({ success: true });

  const { error } = await db.from("order_commissions").update({ status }).in("id", ids);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
