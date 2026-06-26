import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  if (!db) return Response.json({ id, ...body });

  const row: Record<string, unknown> = {};
  if (body.code !== undefined) row.code = body.code;
  if (body.type !== undefined) row.type = body.type;
  if (body.value !== undefined) row.value = body.value;
  if (body.minOrderValue !== undefined) row.min_order_value = body.minOrderValue;
  if (body.maxDiscount !== undefined) row.max_discount = body.maxDiscount;
  if (body.validUntil !== undefined) row.valid_until = body.validUntil;
  if (body.maxUses !== undefined) row.max_uses = body.maxUses;
  if (body.categories !== undefined) row.categories = body.categories;
  if (body.description !== undefined) row.description = body.description;
  if (body.active !== undefined) row.active = body.active;
  if (body.usedCount !== undefined) row.used_count = body.usedCount;
  if (body.usedBy !== undefined) row.used_by = body.usedBy;

  const { data, error } = await db.from("vouchers").update(row).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({
    id: data.id, code: data.code, type: data.type, value: data.value,
    minOrderValue: data.min_order_value, maxDiscount: data.max_discount,
    validUntil: data.valid_until, maxUses: data.max_uses,
    usedCount: data.used_count, usedBy: data.used_by,
    categories: data.categories, description: data.description,
    active: data.active, createdAt: data.created_at,
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  if (!db) return new Response(null, { status: 204 });

  const { error } = await db.from("vouchers").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
