import { NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";

export async function POST(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/bp_refresh=([^;]+)/);
  const rawToken = match ? decodeURIComponent(match[1]) : null;

  if (!rawToken) {
    return NextResponse.json({ error: "No refresh token." }, { status: 401 });
  }

  const payload = verifyRefreshToken(rawToken);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired refresh token." }, { status: 401 });
  }

  const db = getDb();
  if (db) {
    // Check token exists in DB — the only invalidation is an explicit logout
    // which deletes the row. No time-based expiry.
    const { data } = await db
      .from("refresh_tokens")
      .select("id")
      .eq("token", rawToken)
      .single();

    if (!data) {
      return NextResponse.json({ error: "Session revoked. Please log in again." }, { status: 401 });
    }
  }

  const accessToken = signAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  });

  return NextResponse.json({ accessToken, user: payload });
}
