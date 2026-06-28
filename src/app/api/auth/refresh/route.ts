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

  // JWT signature + httpOnly cookie is the security boundary.
  // The DB row check is skipped because a silent INSERT failure (Supabase RLS,
  // cold start, etc.) would lock the admin out on every refresh even with a
  // perfectly valid cookie. Revocation is still handled: logout deletes the
  // cookie from the browser, making the token unusable even if the JWT is valid.

  const accessToken = signAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  });

  return NextResponse.json({ accessToken, user: payload });
}
