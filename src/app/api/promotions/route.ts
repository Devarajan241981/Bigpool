import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { promotionRequests } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");
  const status = searchParams.get("status");

  const db = getDb();
  if (!db) {
    let results = [...promotionRequests];
    if (sellerId) results = results.filter((r) => r.sellerId === sellerId);
    if (status) results = results.filter((r) => r.status === status);
    return Response.json(results);
  }

  let query = db.from("promotion_requests").select("*").order("created_at", { ascending: false });
  if (sellerId) query = query.eq("seller_id", sellerId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data.map(dbRowToPromotion));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  if (!db) {
    return Response.json(
      {
        id: `pr_${Date.now()}`,
        sellerId: body.sellerId, sellerName: body.sellerName,
        productId: body.productId, productName: body.productName,
        type: body.type, budget: body.budget, duration: body.duration,
        status: "pending", message: body.message,
        couponCode: body.couponCode, createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }

  const { data, error } = await db
    .from("promotion_requests")
    .insert({
      seller_id: body.sellerId, seller_name: body.sellerName,
      product_id: body.productId, product_name: body.productName,
      type: body.type, budget: body.budget, duration: body.duration,
      message: body.message, coupon_code: body.couponCode,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(dbRowToPromotion(data), { status: 201 });
}

function dbRowToPromotion(r: Record<string, unknown>) {
  return {
    id: r.id, sellerId: r.seller_id, sellerName: r.seller_name,
    productId: r.product_id, productName: r.product_name,
    type: r.type, budget: r.budget, duration: r.duration,
    status: r.status, message: r.message,
    couponCode: r.coupon_code, createdAt: r.created_at,
  };
}
