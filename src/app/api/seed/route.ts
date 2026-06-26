import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { categories, products, mockVouchers, cashbackOffers } from "@/lib/mock-data";

// Protect with a secret so only you can trigger it.
// Set SEED_SECRET=anything in your .env.local / Vercel env vars.
const SECRET = process.env.SEED_SECRET;

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (!SECRET || searchParams.get("secret") !== SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const results: Record<string, number | string> = {};

  // 1. Categories
  const catRows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
  }));
  const { error: catErr } = await db
    .from("categories")
    .upsert(catRows, { onConflict: "id" });
  results.categories = catErr ? `error: ${catErr.message}` : catRows.length;

  // 2. Seed demo sellers as users (so their products have a real seller_id)
  const demoSellers = [
    { id: "s1", name: "TechWorld Store", email: "vendor@demo.com",   role: "seller", business_name: "TechWorld Store",   status: "approved", verified: true },
    { id: "s2", name: "AudioPro India",  email: "audio@demo.com",    role: "seller", business_name: "AudioPro India",    status: "approved", verified: false },
    { id: "s3", name: "Sports Junction", email: "sports@demo.com",   role: "seller", business_name: "Sports Junction",   status: "approved", verified: false },
    { id: "s4", name: "HomeEssentials",  email: "home@demo.com",     role: "seller", business_name: "HomeEssentials",    status: "approved", verified: false },
    { id: "s5", name: "BookCorner",      email: "books@demo.com",    role: "seller", business_name: "BookCorner",        status: "approved", verified: false },
    { id: "s6", name: "Glamour Hub",     email: "glamour@demo.com",  role: "seller", business_name: "Glamour Hub",       status: "approved", verified: false },
    { id: "s7", name: "ToyKingdom",      email: "toys@demo.com",     role: "seller", business_name: "ToyKingdom",        status: "approved", verified: false },
    { id: "s8", name: "FashionFirst",    email: "fashion@demo.com",  role: "seller", business_name: "FashionFirst",      status: "approved", verified: false },
    { id: "c1", name: "John Doe",        email: "customer@demo.com", role: "customer", business_name: null, status: "approved", verified: false },
    { id: "a1", name: "Admin",           email: "admin@demo.com",    role: "admin",    business_name: null, status: "approved", verified: false },
  ];
  const { error: sellerErr } = await db
    .from("users")
    .upsert(demoSellers, { onConflict: "id" });
  results.users = sellerErr ? `error: ${sellerErr.message}` : demoSellers.length;

  // 3. Products
  const productRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    original_price: p.originalPrice,
    images: p.images,
    category: p.category,
    category_id: p.categoryId,
    seller_id: p.sellerId,
    seller_name: p.sellerName,
    rating: p.rating,
    review_count: p.reviewCount,
    stock: p.stock,
    tags: p.tags,
    specifications: p.specifications,
    discount: p.discount,
    featured: p.featured,
    promoted: p.promoted,
    is_demo: true,
    status: "active",
  }));
  const { error: prodErr } = await db
    .from("products")
    .upsert(productRows, { onConflict: "id" });
  results.products = prodErr ? `error: ${prodErr.message}` : productRows.length;

  // 4. Vouchers
  const voucherRows = mockVouchers.map((v) => ({
    id: v.id,
    code: v.code,
    discount_type: v.type,
    discount_value: v.value,
    min_order_value: v.minOrderValue,
    max_uses: v.maxUses,
    used_count: v.usedCount,
    expiry_date: v.validUntil,
    is_active: v.active,
    seller_id: null,
    category_id: v.categories?.[0] ?? null,
  }));
  const { error: voucherErr } = await db
    .from("vouchers")
    .upsert(voucherRows, { onConflict: "id" });
  results.vouchers = voucherErr ? `error: ${voucherErr.message}` : voucherRows.length;

  // 5. Cashback offers
  const offerRows = cashbackOffers.map((o) => ({
    id: o.id,
    title: o.description,
    description: o.description,
    cashback_percent: o.percentage,
    max_cashback: o.maxAmount,
    min_order_value: o.minOrderValue,
    category_id: o.categories?.[0] ?? null,
    payment_method: null,
    is_active: o.active,
    expiry_date: o.validUntil,
  }));
  const { error: offerErr } = await db
    .from("cashback_offers")
    .upsert(offerRows, { onConflict: "id" });
  results.cashback_offers = offerErr ? `error: ${offerErr.message}` : offerRows.length;

  return Response.json({
    message: "Seed complete ✅",
    inserted: results,
  });
}
