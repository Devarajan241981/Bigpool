import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { mockRefunds } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const status = searchParams.get("status");

  const db = getDb();
  if (!db) {
    let results = [...mockRefunds];
    if (customerId) results = results.filter((r) => r.customerId === customerId);
    if (status) results = results.filter((r) => r.status === status);
    return Response.json(results);
  }

  let query = db.from("refund_requests").select("*").order("created_at", { ascending: false });
  if (customerId) query = query.eq("customer_id", customerId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(
    data.map((r: Record<string, unknown>) => ({
      id: r.id, orderId: r.order_id, customerId: r.customer_id,
      customerName: r.customer_name, reason: r.reason, status: r.status,
      amount: r.amount, createdAt: r.created_at, updatedAt: r.updated_at,
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  if (!db) {
    const refund = {
      id: `REF-${Date.now()}`,
      orderId: body.orderId,
      customerId: body.customerId,
      customerName: body.customerName,
      reason: body.reason,
      status: "pending",
      amount: body.amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return Response.json(refund, { status: 201 });
  }

  const { data, error } = await db
    .from("refund_requests")
    .insert({
      order_id: body.orderId,
      customer_id: body.customerId,
      customer_name: body.customerName,
      reason: body.reason,
      amount: body.amount,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(
    {
      id: data.id, orderId: data.order_id, customerId: data.customer_id,
      customerName: data.customer_name, reason: data.reason, status: data.status,
      amount: data.amount, createdAt: data.created_at, updatedAt: data.updated_at,
    },
    { status: 201 }
  );
}
