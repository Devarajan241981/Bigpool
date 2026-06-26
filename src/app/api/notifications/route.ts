import { NextRequest } from "next/server";
import { getDb } from "@/lib/supabase";
import { mockNotifications } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  const db = getDb();
  if (!db) {
    const results = userId
      ? mockNotifications.filter((n) => n.userId === userId)
      : mockNotifications;
    return Response.json(results);
  }

  let query = db.from("notifications").select("*").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(
    data.map((r: Record<string, unknown>) => ({
      id: r.id, userId: r.user_id, title: r.title, message: r.message,
      type: r.type, read: r.read, link: r.link, createdAt: r.created_at,
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  if (!db) {
    return Response.json(
      {
        id: `n_${Date.now()}`,
        userId: body.userId, title: body.title, message: body.message,
        type: body.type, read: false, link: body.link,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }

  const { data, error } = await db
    .from("notifications")
    .insert({
      user_id: body.userId, title: body.title, message: body.message,
      type: body.type, link: body.link,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(
    {
      id: data.id, userId: data.user_id, title: data.title, message: data.message,
      type: data.type, read: data.read, link: data.link, createdAt: data.created_at,
    },
    { status: 201 }
  );
}
