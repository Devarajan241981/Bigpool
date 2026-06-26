import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { cashbackOffers } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const { orderId, userId, orderTotal, categoryIds = [] } = await request.json();
  if (!orderId || typeof orderTotal !== "number") {
    return Response.json({ error: "orderId and orderTotal are required" }, { status: 400 });
  }

  const db = getDb();
  let offers = cashbackOffers;

  if (db) {
    const { data } = await db
      .from("cashback_offers")
      .select("*")
      .eq("active", true)
      .gt("valid_until", new Date().toISOString())
      .gte("min_order_value", 0);
    if (data) {
      offers = data.map((r: Record<string, unknown>) => ({
        id: String(r.id), percentage: Number(r.percentage), maxAmount: Number(r.max_amount),
        minOrderValue: Number(r.min_order_value ?? 0), validUntil: String(r.valid_until),
        description: String(r.description ?? ""), categories: r.categories as string[] | undefined,
        active: Boolean(r.active),
      }));
    }
  }

  const now = new Date();
  const applicable = offers.filter((o) => {
    if (!o.active || new Date(o.validUntil) < now || orderTotal < o.minOrderValue) return false;
    if (o.categories?.length && categoryIds.length)
      return o.categories.some((c) => categoryIds.includes(c));
    return !o.categories?.length;
  });

  if (!applicable.length) return Response.json({ amount: 0 });

  const best = applicable.reduce((a, b) => {
    const aAmt = Math.min((orderTotal * a.percentage) / 100, a.maxAmount);
    const bAmt = Math.min((orderTotal * b.percentage) / 100, b.maxAmount);
    return aAmt >= bAmt ? a : b;
  });

  const amount = Math.floor(Math.min((orderTotal * best.percentage) / 100, best.maxAmount));
  if (amount <= 0) return Response.json({ amount: 0 });

  if (db && userId) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.from("cashback_transactions").insert({
      user_id: userId,
      order_id: orderId,
      amount,
      percentage: best.percentage,
      status: "pending",
      expires_at: expiresAt,
    });
  }

  return Response.json({ amount, percentage: best.percentage });
}
