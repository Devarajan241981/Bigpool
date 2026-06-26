import { getDb } from "@/lib/supabase";
import { cashbackOffers } from "@/lib/mock-data";

export async function GET() {
  const db = getDb();
  if (!db) return Response.json(cashbackOffers);

  const { data, error } = await db
    .from("cashback_offers")
    .select("*")
    .eq("active", true)
    .gt("valid_until", new Date().toISOString());
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(
    data.map((r: Record<string, unknown>) => ({
      id: r.id,
      percentage: r.percentage,
      maxAmount: r.max_amount,
      minOrderValue: r.min_order_value ?? 0,
      validUntil: r.valid_until,
      description: r.description,
      categories: r.categories,
      active: r.active,
    }))
  );
}
