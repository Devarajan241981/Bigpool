import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  if (!db) return Response.json({ id, ...body, updatedAt: new Date().toISOString() });

  const { data, error } = await db
    .from("refund_requests")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    id: data.id, orderId: data.order_id, customerId: data.customer_id,
    customerName: data.customer_name, reason: data.reason, status: data.status,
    amount: data.amount, createdAt: data.created_at, updatedAt: data.updated_at,
  });
}
