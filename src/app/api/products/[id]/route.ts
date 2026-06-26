import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { products as mockProducts } from "@/lib/mock-data";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  if (!db) {
    const product = mockProducts.find((p) => p.id === id);
    if (!product) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(product);
  }

  const { data, error } = await db.from("products").select("*").eq("id", id).single();
  if (error) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(dbRowToProduct(data));
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  if (!db) {
    const product = mockProducts.find((p) => p.id === id);
    if (!product) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ...product, ...body });
  }

  const row: Record<string, unknown> = {};
  if (body.name !== undefined) row.name = body.name;
  if (body.description !== undefined) row.description = body.description;
  if (body.price !== undefined) row.price = body.price;
  if (body.originalPrice !== undefined) row.original_price = body.originalPrice;
  if (body.images !== undefined) row.images = body.images;
  if (body.stock !== undefined) row.stock = body.stock;
  if (body.tags !== undefined) row.tags = body.tags;
  if (body.specifications !== undefined) row.specifications = body.specifications;
  if (body.discount !== undefined) row.discount = body.discount;
  if (body.featured !== undefined) row.featured = body.featured;
  if (body.promoted !== undefined) row.promoted = body.promoted;
  if (body.status !== undefined) row.status = body.status;
  if (body.rating !== undefined) row.rating = body.rating;
  if (body.reviewCount !== undefined) row.review_count = body.reviewCount;

  const { data, error } = await db.from("products").update(row).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(dbRowToProduct(data));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const db = getDb();
  if (!db) return new Response(null, { status: 204 });

  const { error } = await db.from("products").update({ status: "deleted" }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}

function dbRowToProduct(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    originalPrice: row.original_price,
    images: row.images,
    category: row.category,
    categoryId: row.category_id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    stock: row.stock,
    tags: row.tags ?? [],
    specifications: row.specifications ?? {},
    discount: row.discount ?? 0,
    featured: row.featured ?? false,
    promoted: row.promoted ?? false,
    isDemo: row.is_demo ?? false,
    createdAt: row.created_at,
  };
}
