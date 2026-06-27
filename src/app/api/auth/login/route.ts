import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/supabase";
import { findUser } from "@/lib/server-store";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

// In-memory rate limiter: max 10 attempts per IP per 15 min
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

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

  // httpOnly cookie — JS cannot read this (XSS safe).
  // 1-year maxAge: session stays alive until user explicitly logs out.
  res.cookies.set("bp_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  // Store refresh token in DB — no expires_at, token is valid until logout
  const db = getDb();
  if (db) {
    db.from("refresh_tokens").insert({
      id: rtId,
      user_id: user.id,
      email: user.email,
      token: refreshToken,
    }).then(() => {});
  }

  return res;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many login attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const { email, password } = body;
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (email.length > 254 || password.length > 128) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
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

    if (!profile) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Support bcrypt hashes and plain-text legacy passwords (auto-upgrade on match)
    const isHashed = profile.password?.startsWith("$2");
    const passwordOk = isHashed
      ? await bcrypt.compare(password, profile.password)
      : profile.password === password;

    if (!passwordOk) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Upgrade plain-text password to bcrypt hash transparently
    if (!isHashed) {
      const hashed = await bcrypt.hash(password, 12);
      db.from("users").update({ password: hashed }).eq("id", profile.id).then(() => {});
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
  if (!serverUser) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const memHashed = serverUser.password?.startsWith("$2");
  const memOk = memHashed
    ? await bcrypt.compare(password, serverUser.password)
    : serverUser.password === password;
  if (!memOk) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const { password: _, ...safe } = serverUser;
  return buildResponse({ ...safe, avatar: undefined, address: undefined });
}
