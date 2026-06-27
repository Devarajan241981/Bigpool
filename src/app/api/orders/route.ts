import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { mockOrders } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const sellerId = searchParams.get("sellerId");
  const status = searchParams.get("status");

  const db = getDb();
  if (!db) {
    let results = [...mockOrders];
    if (customerId) results = results.filter((o) => o.customerId === customerId);
    if (sellerId) results = results.filter((o) =>
      o.items.some((i) => i.product.sellerId === sellerId)
    );
    if (status) results = results.filter((o) => o.status === status);
    return Response.json(results);
  }

  let query = db.from("orders").select("*").order("created_at", { ascending: false });
  if (customerId) query = query.eq("customer_id", customerId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let orders = data.map(dbRowToOrder);

  // Vendor filter: filter in memory since items is JSONB
  if (sellerId) {
    orders = orders.filter((o) =>
      Array.isArray(o.items) &&
      o.items.some((i: { product?: { sellerId?: string } }) => i.product?.sellerId === sellerId)
    );
  }

  return Response.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  const orderId = `ORD-${Date.now()}`;
  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-IN");

  const newOrder = {
    id: orderId,
    customerId: body.customerId,
    customerName: body.customerName,
    items: body.items,
    total: body.total,
    status: "placed",
    paymentStatus: body.paymentStatus ?? "paid",
    paymentMethod: body.paymentMethod,
    address: body.address,
    voucherCode: body.voucherCode,
    voucherDiscount: body.voucherDiscount ?? 0,
    cashbackAmount: body.cashbackAmount ?? 0,
    estimatedDelivery,
    tracking: [
      {
        status: "placed",
        location: "Online",
        timestamp: new Date().toISOString(),
        description: "Order placed successfully",
      },
    ],
    createdAt: new Date().toISOString(),
  };

  if (!db) return Response.json(newOrder, { status: 201 });

  const row = {
    id: orderId,
    customer_id: body.customerId,
    customer_name: body.customerName,
    items: body.items,
    total: body.total,
    status: "placed",
    payment_status: body.paymentStatus ?? "paid",
    payment_method: body.paymentMethod,
    address: body.address,
    voucher_code: body.voucherCode,
    voucher_discount: body.voucherDiscount ?? 0,
    cashback_amount: body.cashbackAmount ?? 0,
    estimated_delivery: estimatedDelivery,
    tracking: newOrder.tracking,
  };

  const { data, error } = await db.from("orders").insert(row).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(dbRowToOrder(data), { status: 201 });
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
    createdAt: row.created_at instanceof Date
      ? row.created_at.toLocaleDateString("en-IN")
      : String(row.created_at ?? "").split("T")[0],
  };
}
