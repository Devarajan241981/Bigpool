import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { mockReviews } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  const db = getDb();
  if (!db) {
    const reviews = productId
      ? mockReviews.filter((r) => r.productId === productId)
      : mockReviews;
    return Response.json(reviews);
  }

  let query = db.from("reviews").select("*").order("created_at", { ascending: false });
  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(
    data.map((r: Record<string, unknown>) => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      userName: r.user_name,
      rating: r.rating,
      comment: r.comment,
      images: r.images ?? [],
      createdAt: r.created_at,
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.productId || !body.userId || !body.rating) {
    return Response.json({ error: "productId, userId, and rating are required" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    const review = {
      id: `r_${Date.now()}`,
      productId: body.productId,
      userId: body.userId,
      userName: body.userName,
      rating: body.rating,
      comment: body.comment ?? "",
      images: body.images ?? [],
      createdAt: new Date().toISOString(),
    };
    return Response.json(review, { status: 201 });
  }

  const { data, error } = await db
    .from("reviews")
    .upsert(
      {
        product_id: body.productId,
        user_id: body.userId,
        user_name: body.userName,
        rating: body.rating,
        comment: body.comment ?? "",
        images: body.images ?? [],
      },
      { onConflict: "product_id,user_id" }
    )
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Update product rating average
  const { data: allReviews } = await db
    .from("reviews")
    .select("rating")
    .eq("product_id", body.productId);
  if (allReviews?.length) {
    const avg = allReviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / allReviews.length;
    await db
      .from("products")
      .update({ rating: Math.round(avg * 10) / 10, review_count: allReviews.length })
      .eq("id", body.productId);
  }

  return Response.json(
    {
      id: data.id, productId: data.product_id, userId: data.user_id,
      userName: data.user_name, rating: data.rating, comment: data.comment,
      createdAt: data.created_at,
    },
    { status: 201 }
  );
}
