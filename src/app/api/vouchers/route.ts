import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { mockVouchers } from "@/lib/mock-data";

export async function GET() {
  const db = getDb();
  if (!db) return Response.json(mockVouchers);

  const { data, error } = await db
    .from("vouchers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map(dbRowToVoucher));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  if (!db) {
    const v = {
      ...body,
      id: `v_${Date.now()}`,
      usedCount: 0,
      usedBy: [],
      createdAt: new Date().toISOString(),
    };
    return Response.json(v, { status: 201 });
  }

  const row = {
    code: body.code,
    type: body.type,
    value: body.value,
    min_order_value: body.minOrderValue ?? 0,
    max_discount: body.maxDiscount,
    valid_until: body.validUntil,
    max_uses: body.maxUses,
    categories: body.categories,
    description: body.description,
    active: body.active ?? true,
  };

  const { data, error } = await db.from("vouchers").insert(row).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(dbRowToVoucher(data), { status: 201 });
}

function dbRowToVoucher(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    minOrderValue: row.min_order_value ?? 0,
    maxDiscount: row.max_discount,
    validUntil: row.valid_until,
    maxUses: row.max_uses,
    usedCount: row.used_count ?? 0,
    usedBy: row.used_by ?? [],
    categories: row.categories,
    description: row.description,
    active: row.active,
    createdAt: row.created_at,
  };
}
