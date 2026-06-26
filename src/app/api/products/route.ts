import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { products as mockProducts } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const sellerId = searchParams.get("sellerId");
  const featured = searchParams.get("featured");
  const sort = searchParams.get("sort");

  const db = getDb();
  if (!db) {
    let results = [...mockProducts];
    if (category) results = results.filter((p) => p.categoryId === category || p.category.toLowerCase() === category);
    if (q) results = results.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.tags.some((t) => t.includes(q.toLowerCase())));
    if (sellerId) results = results.filter((p) => p.sellerId === sellerId);
    if (featured === "true") results = results.filter((p) => p.featured);
    if (sort === "price_asc") results.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") results.sort((a, b) => b.price - a.price);
    else if (sort === "rating") results.sort((a, b) => b.rating - a.rating);
    return Response.json(results);
  }

  let query = db.from("products").select("*").eq("status", "active");
  if (category) query = query.or(`category_id.eq.${category},category.ilike.${category}`);
  if (q) query = query.textSearch("name", q, { type: "websearch" });
  if (sellerId) query = query.eq("seller_id", sellerId);
  if (featured === "true") query = query.eq("featured", true);
  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else if (sort === "rating") query = query.order("rating", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  if (!db) {
    const product = {
      ...body,
      id: `p_${Date.now()}`,
      rating: 0,
      reviewCount: 0,
      promoted: false,
      featured: false,
      createdAt: new Date().toISOString(),
    };
    return Response.json(product, { status: 201 });
  }

  const row = {
    name: body.name,
    description: body.description,
    price: body.price,
    original_price: body.originalPrice,
    images: body.images,
    category: body.category,
    category_id: body.categoryId,
    seller_id: body.sellerId,
    seller_name: body.sellerName,
    stock: body.stock,
    tags: body.tags ?? [],
    specifications: body.specifications ?? {},
    discount: body.discount ?? 0,
  };

  const { data, error } = await db.from("products").insert(row).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(dbRowToProduct(data), { status: 201 });
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
