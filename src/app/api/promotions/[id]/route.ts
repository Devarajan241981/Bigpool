import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  if (!db) return Response.json({ id, ...body });

  const { data, error } = await db
    .from("promotion_requests")
    .update({ status: body.status, coupon_code: body.couponCode })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    id: data.id, sellerId: data.seller_id, sellerName: data.seller_name,
    productId: data.product_id, productName: data.product_name,
    type: data.type, budget: data.budget, duration: data.duration,
    status: data.status, message: data.message,
    couponCode: data.coupon_code, createdAt: data.created_at,
  });
}
