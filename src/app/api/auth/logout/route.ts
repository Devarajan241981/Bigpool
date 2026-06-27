import { NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";

export async function POST(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/bp_refresh=([^;]+)/);
  const rawToken = match ? decodeURIComponent(match[1]) : null;

  if (rawToken) {
    const db = getDb();
    if (db) {
      await db.from("refresh_tokens").delete().eq("token", rawToken);
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("bp_refresh", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
