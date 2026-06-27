import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/supabase";
import { findUser } from "@/lib/server-store";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

function tokenId() {
  return `rt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildResponse(user: {
  id: string; name: string; email: string; role: string;
  avatar?: string; phone?: string; address?: unknown; createdAt: string;
}) {
  const payload = { userId: user.id, email: user.email, role: user.role, name: user.name };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const rtId = tokenId();

  const res = NextResponse.json({ user, accessToken });

  // httpOnly cookie — JS cannot read this (XSS safe)
  res.cookies.set("bp_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Store refresh token in DB (non-blocking)
  const db = getDb();
  if (db) {
    db.from("refresh_tokens").insert({
      id: rtId,
      user_id: user.id,
      email: user.email,
      token: refreshToken,
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }).then(() => {});
  }

  return res;
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Admin env-var credentials always take priority
  const adminEmail    = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName     = process.env.ADMIN_NAME ?? "Super Admin";

  if (adminEmail && adminPassword && normalizedEmail === adminEmail && password === adminPassword) {
    return buildResponse({
      id: "admin-1", name: adminName, email: adminEmail, role: "admin", createdAt: "2024-01-01",
    });
  }

  const db = getDb();

  if (db) {
    const { data: profile } = await db
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (!profile || profile.password !== password) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    return buildResponse({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar ?? undefined,
      phone: profile.phone ?? undefined,
      address: profile.address ?? undefined,
      createdAt: profile.created_at,
    });
  }

  // In-memory fallback
  const serverUser = findUser(normalizedEmail);
  if (!serverUser || serverUser.password !== password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const { password: _, ...safe } = serverUser;
  return buildResponse({ ...safe, avatar: undefined, address: undefined });
}
