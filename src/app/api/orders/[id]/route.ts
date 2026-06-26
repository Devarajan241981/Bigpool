import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { mockOrders } from "@/lib/mock-data";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  if (!db) {
    const order = mockOrders.find((o) => o.id === id);
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(order);
  }

  const { data, error } = await db.from("orders").select("*").eq("id", id).single();
  if (error) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(dbRowToOrder(data));
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const trackingEntry = body.status
    ? {
        status: body.status,
        location: "Bigpool",
        timestamp: new Date().toLocaleString("en-IN"),
        description: `Status updated to: ${(body.status as string).replace(/_/g, " ")}`,
      }
    : null;

  if (!db) {
    const order = mockOrders.find((o) => o.id === id);
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    const updated = {
      ...order,
      ...body,
      tracking: trackingEntry
        ? [...order.tracking, trackingEntry]
        : order.tracking,
    };
    return Response.json(updated);
  }

  // Get current tracking to append
  const { data: current } = await db.from("orders").select("tracking").eq("id", id).single();
  const currentTracking = Array.isArray(current?.tracking) ? current.tracking : [];

  const row: Record<string, unknown> = {};
  if (body.status) row.status = body.status;
  if (body.paymentStatus) row.payment_status = body.paymentStatus;
  if (trackingEntry) row.tracking = [...currentTracking, trackingEntry];

  const { data, error } = await db.from("orders").update(row).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(dbRowToOrder(data));
}

function dbRowToOrder(row: Record<string, unknown>) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    items: row.items,
    total: row.total,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    address: row.address,
    voucherCode: row.voucher_code,
    voucherDiscount: row.voucher_discount,
    cashbackAmount: row.cashback_amount,
    estimatedDelivery: row.estimated_delivery,
    tracking: row.tracking ?? [],
    createdAt: String(row.created_at ?? "").split("T")[0],
  };
}
