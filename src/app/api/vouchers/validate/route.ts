import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { mockVouchers } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const { code, orderTotal, categoryIds = [] } = await request.json();
  if (!code || typeof orderTotal !== "number") {
    return Response.json({ error: "code and orderTotal are required" }, { status: 400 });
  }

  const db = getDb();
  let vouchers = mockVouchers;

  if (db) {
    const { data, error } = await db
      .from("vouchers")
      .select("*")
      .ilike("code", code)
      .eq("active", true)
      .single();
    if (error || !data) {
      return Response.json({ error: "Invalid or expired voucher code." }, { status: 400 });
    }
    vouchers = [
      {
        id: data.id, code: data.code, type: data.type, value: data.value,
        minOrderValue: data.min_order_value ?? 0, maxDiscount: data.max_discount,
        validUntil: data.valid_until, maxUses: data.max_uses,
        usedCount: data.used_count ?? 0, usedBy: data.used_by ?? [],
        categories: data.categories, description: data.description,
        active: data.active, createdAt: data.created_at,
      },
    ];
  }

  const voucher = vouchers.find((v) => v.code.toUpperCase() === code.toUpperCase() && v.active);
  if (!voucher) return Response.json({ error: "Invalid or expired voucher code." }, { status: 400 });

  const now = new Date();
  if (new Date(voucher.validUntil) < now)
    return Response.json({ error: "This voucher has expired." }, { status: 400 });
  if (voucher.usedCount >= voucher.maxUses)
    return Response.json({ error: "This voucher has reached its usage limit." }, { status: 400 });
  if (orderTotal < voucher.minOrderValue)
    return Response.json(
      { error: `Minimum order of ₹${voucher.minOrderValue.toLocaleString()} required.` },
      { status: 400 }
    );

  if (voucher.categories?.length && categoryIds.length) {
    const overlap = voucher.categories.some((c: string) => categoryIds.includes(c));
    if (!overlap)
      return Response.json(
        { error: "This voucher doesn't apply to your cart items." },
        { status: 400 }
      );
  }

  let discount = 0;
  if (voucher.type === "percentage") {
    discount = Math.floor((orderTotal * voucher.value) / 100);
    if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
  } else if (voucher.type === "flat") {
    discount = voucher.value;
  } else if (voucher.type === "free_delivery") {
    discount = 40;
  }
  discount = Math.min(discount, orderTotal);

  return Response.json({ voucher, discount });
}
